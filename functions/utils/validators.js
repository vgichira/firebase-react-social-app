// check if the email is valid

const isValidEmail = (email) => {
    const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if(email.match(emailRegEx)) return true;
}

exports.validateSignupData = ({ email, handle, password, confirmPassword })=>{
    // check if the email has been provided
    
    let errors = {};

    if(!email){
        errors.email = "Email address is required";
    } else if(!isValidEmail(email)){
        errors.email = "Please enter a valid email";
    }

    // validate handle

    if(!handle) errors.handle = "User handle is required";

    // validate password

    if(!password) errors.password = "Password is required.";

    // check if both password and confirm password match

    if(password !== confirmPassword) errors.confirmPassword = "Passwords do not match";

    return {
        errors,
        valid: Object.keys(errors).length === 0
    }
}

exports.validateLoginData = ({ email, password }) => {
    let errors = {};

    //email validation

    if(!email) errors.email = "Email is required";

    // password validation

    if(!password) errors.password = "Password is required"

    return {
        errors,
        valid: Object.keys(errors).length === 0
    }
}

exports.reduceUserData = ({ bio, website, location }) => {
    let userDetails = {};

    if(bio) userDetails.bio = bio.trim();

    if(website) {
        if(website.trim().substring(0, 4) !== "http"){
            userDetails.website = `http://${website}`;
        }else userDetails.website = website;
    }

    if(location) userDetails.location = location.trim();

    return userDetails;
}