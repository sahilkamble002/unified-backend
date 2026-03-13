class apiResponse{
    constructor(
        StatusCode,
        message = "success",
        data
    ){
        this.StatusCode = StatusCode;
        this.message = message;
        this.data = data;
    }
}

export {apiResponse};