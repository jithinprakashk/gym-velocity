-- Count working-day attendance from the payment-anchored membership start.

create or replace function public.official_attendance_days(p_membership_id uuid)
returns integer language sql stable security definer set search_path = '' as $$
  select count(*)::integer
    from public.official_attendance a
    join public.memberships m on m.id = p_membership_id and m.member_id = a.member_id
    left join (
      select membership_id, min(paid_on) as first_payment_date
      from public.payments
      where status = 'valid'
      group by membership_id
    ) pay on pay.membership_id = m.id
   where m.model = 'working_days'
     and a.status = 'present'
     and a.attendance_date >= coalesce(pay.first_payment_date, m.start_date)
     and a.attendance_date < coalesce(
       (
         select min(coalesce(next_pay.first_payment_date, next_m.start_date))
           from public.memberships next_m
           left join (
             select membership_id, min(paid_on) as first_payment_date
             from public.payments
             where status = 'valid'
             group by membership_id
           ) next_pay on next_pay.membership_id = next_m.id
          where next_m.member_id = m.member_id
            and next_m.start_date > m.start_date
       ),
       '9999-12-31'::date
     )
     and not public.is_gym_closed(a.attendance_date);
$$;

grant execute on function public.official_attendance_days(uuid) to authenticated;
