const AWS = require('aws-sdk');
const config = require('./global_configuration');
const fs = require('fs');
const path = require('path');
class BaseStorage {

    store_local_file(req) {

    }


}

class S3Stroage extends BaseStorage {
    async get_login_configuration() {

      await (async ()=>{  if (!S3Stroage.s3_login) {
            S3Stroage.s3_login = {};
            S3Stroage.s3_configuration = await config.get_storage_config();
            S3Stroage.s3_login['accessKeyId'] = S3Stroage.s3_configuration['accessKeyId'];
            S3Stroage.s3_login['secretAccessKey'] = S3Stroage.s3_configuration['secretAccessKey'];

        }
    })();

        return S3Stroage.s3_login;
    }
    get_bucket_name(user_id) {
        return 'irbucket1';
    }
    constructor() {
        super();
        if (!S3Stroage.initialized) {
            return (async ()=>{
            
            S3Stroage.initialized = true;
            S3Stroage.s3_configuration = null;
            S3Stroage.s3_login = null;
            let login = await this.get_login_configuration();
            AWS.config.update(login);
            return this;
            
        })();
    }
    }

    /*
        Geneerate file name. Abstraction required for generating file name from id.
    */

    get_filename(file_id, callback, user_id = "default_user") {
        return path.basename(file_id);
    }

    download(file_id, res, user_id = "default_user") {

        let params = {};
        params['Bucket'] = this.get_bucket_name();
        params['Key'] = this.get_filename(file_id);
        var s3 = new AWS.S3();
        let file_stream = s3.getObject(params).createReadStream();
        file_stream.pipe(res);
    }

    async upload(file_id) {
        return new Promise((resolve, reject) => {
            fs.readFile(file_id, (err, data) => {

                if (err) {
                    throw err;
                }

                else {
                    let params = {};
                    params['Bucket'] = this.get_bucket_name();
                    params['Key'] = this.get_filename(file_id);
                    params['Body'] = new Buffer(data, 'binary');
                    var s3 = new AWS.S3();
                    s3.upload(params, (s3_err, s3_data) => {

                        if (s3_err) {
                            reject(s3_err);
                        }
                        else {
                            resolve("Uploaded file " + file_id);
                        }

                    });
                }


            });
        });
    }

}

module.exports.S3Stroage = S3Stroage;
module.exports.BaseStorage = BaseStorage;

async function test(){

    let storage = await new S3Stroage();
    await storage.upload('config_template.json');

};

if (require.main == module) {

    test();
}