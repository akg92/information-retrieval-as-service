/*
 This file contain funnction to integrate multiple services.
*/
const storage = require('./storage');
const indexer = require('./retrieval');
const path_module = require('path');
module.exports.add_new_file = async (acutal_filename, temp_file) => {

    //s3 upload

    let s3 = await new storage.S3Stroage();
    let s3_promise = s3.upload(temp_file);
    let index = { "main_index": acutal_filename, "secondary_index": acutal_filename };
    let elastic = await new indexer.Retriver();
    let elatic_promise = elastic.insert_document(index.main_index, index.secondary_index, acutal_filename, temp_file);

    return new Promise((resolve, reject) => {
        s3_promise.then(() => {
            elatic_promise.then(() => {
                resolve();
            });
        })
    });
}
/*
 Function to set headers.
*/
const CONTENT_MAPPING = {".jpg":"image/jpeg",".png":"image/png",".pdf":"application/pdf"}
var set_headers= (res,file_id)=>{

    let ext = path_module.extname(file_id);
    let content_type ="application/octet-stream";
    if (CONTENT_MAPPING[ext]){
        content_type = CONTENT_MAPPING[ext];
    }
    res.setHeader("Content-type",content_type);
} 
module.exports.get_file_byid = async (file_id,res)=>{

    let s3 = await new storage.S3Stroage();
    set_headers(res,file_id);
    s3.download(file_id,res);
}



