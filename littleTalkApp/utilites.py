# permissions

def can_edit_or_delete_log(user, log_entry):
    return (
        log_entry.user == user or
        (user.profile.school == log_entry.user.profile.school and (
            user.profile.is_admin() or user.profile.is_manager()
        ))
    )