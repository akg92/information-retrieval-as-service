const  AWS = require('aws-sdk');
const config = require('./global_configuration');
const fs = require('fs');
class BaseStorage{

    store_local_file(req){
        
    }


}

class S3Stroage extends BaseStorage{

    static initialized = false;
    static s3_configuration = null;
    static s3_login = null;
    get_login_configuration(){

        if(! s3_login){
            s3_login = {};
            s3_configuration = await config.get_storage_config();
            s3_login['accessKeyId'] = s3_configuration['accessKeyId'];
            s3_login['secretAccessKey'] = s3_configuration['secretAccessKey'];
            
        }

        return s3_login;
    }
    get_bucket_name(user_id){
        return s3_configuration['bucket_prefix']+"_"+user_id;   
    }
    constructor(){
        if(! initialized){
            let login  = get_login_configuration();
            AWS.config.update(login);
            initialized = true;
        }
    }

    /*
        Geneerate file name. Abstraction required for generating file name from id.
    */

    get_filename(file_id,callback,user_id="default_user"){
        return  file_id;
    }

    download(file_id,res,user_id="default_user"){

        let params = {};
        params['Bucket'] = get_bucket_name();
        params['Key'] = get_filename(file_id);
        var s3 = new AWS.S3();
        let file_stream = s3.getObject(params).createReadStream();
        file_stream.pipe(res);
    }

    upload(file_id,res,callback){
        fs.readFile(file_id,(err,data)=>{

            if (err){
                throw err;
            }

            else{
                let params = {};
                params['Bucket'] = get_bucket_name();
                params['Key'] = get_filename(file_id);
                params['Body'] = new Buffer(data,'binary');
                var s3 = new AWS.S3();
                s3.upload(params,(s3_err,s3,data)=>{

                    if(err){
                        throw err;
                    }
                    else{
                        console.log("Uploaded file "+file_id);
                    }

                });
            }


        });
    }

}