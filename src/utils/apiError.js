class apiError extends Error {
    constructor(
        StatusCode,
        message = "something went wrong",
        error = [],
        stack = " "
    ){
        super(message);
        this.StatusCode = StatusCode;
        this.status = StatusCode;
        this.data = null;
        this.message = message;
        this.error = error;
        
        if(stack){
            this.stack = stack;
        }else{
            Error.captureStackTrace(this,this.constructor);
        }
    }
}

export {apiError};

