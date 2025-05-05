set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
    return (
        select id
        from auth.users
        where email = p_email
        limit 1
    );
end;
$function$
;
