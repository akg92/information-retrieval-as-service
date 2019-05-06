/*
 This file contain funnction to integrate multiple services.
*/
const storage = require('./storage');
const indexer = require('./retrieval');
const ml_extractor = require('./ml_index_extractor');
const path_module = require('path');
module.exports.add_new_file = async (acutal_filename, temp_file) => {

    //s3 upload

    let s3 = await new storage.S3Stroage();
    let s3_promise = s3.upload(temp_file);
    let file_extractor = new ml_extractor.FileExtractor();


    return new Promise((resolve, reject) => {
        //sync using binary variable
        let all_completed = false;
        file_extractor.index(temp_file).then(async (ml_index) => {
            let index = ml_index;
            let elastic = await new indexer.Retriver();
            let elatic_promise = elastic.insert_document(index.main_index, index.secondary_index, acutal_filename, temp_file);
            elatic_promise.then(() => {
                if (!all_completed) {
                    all_completed = true;
                }
                else {
                    resolve();
                }
            });
        }, (error) => {
            console.log("Error in the indexing");
        });

        s3_promise.then(() => {
            if (!all_completed) {
                all_completed = true;
            }
            else {
                resolve();
            }
        })
    });
}
/*
 Function to set headers.
*/
const CONTENT_MAPPING = { ".jpg": "image/jpeg", ".png": "image/png", ".pdf": "application/pdf" }
var set_headers = (res, file_id) => {

    let ext = path_module.extname(file_id);
    let content_type = "application/octet-stream";
    if (CONTENT_MAPPING[ext]) {
        content_type = CONTENT_MAPPING[ext];
    }
    res.setHeader("Content-type", content_type);
}
module.exports.get_file_byid = async (file_id, res) => {

    let s3 = await new storage.S3Stroage();
    set_headers(res, file_id);
    s3.download(file_id, res);
}

set_generic_header = (res, status) => {
    res.setHeader("Content-Type", "application/json");
    res.status(status);
};
// clean the elastic search result
clean_the_index_result = (data) => {
    let data_json = data;
    let result = [];
    for (let i in data_json) {
        obj = data_json[i]._source;
        result.push({ "file_name": obj.file_name, "file_id": obj.file_id });
    }
    return JSON.stringify(result);
}

module.exports.serach = async (query, res) => {
    let elastic = await new indexer.Retriver();
    //set header;

    return new Promise((reseolve, reject) => {
        elastic.search_document(query).then(
            (data) => {
                set_generic_header(res, 200);
                data = clean_the_index_result(data);
                res.send(data);
            },/*On error*/() => {
                set_generic_header(res, 204);
                res.send();
            }
        );

    });
};

