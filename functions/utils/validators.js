// check if the email is valid

const isValidEmail = (email) => {
    const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if(email.match(emailRegEx)) return true;
}

exports.validateSignupData = (data)=>{
    // check if the email has been provided
    
    let errors = {};

    if(!data.email){
        errors.email = "Email address is required";
    } else if(!isValidEmail(data.email)){
        errors.email = "Please enter a valid email";
    }

    // validate handle

    if(!data.handle) errors.handle = "User handle is required";

    // validate password

    if(!data.password) errors.password = "Password is required.";

    // check if both password and confirm password match

    if(data.password !== data.confirmPassword) errors.confirmPassword = "Passwords do not match";

    return {
        errors,
        valid: Object.keys(errors).length === 0
    }
}

exports.validateLoginData = (data) => {
    let errors = {};

    //email validation

    if(!data.email) errors.email = "Email is required";

    // password validation

    if(!data.password) errors.password = "Password is required"

    return {
        errors,
        valid: Object.keys(errors).length === 0
    }
}