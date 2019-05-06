//var config = require('config');

var AWS = require('aws-sdk');

var uuid = require('node-uuid');
//var fs = require('fs-extra');
var path = require('path');
const aws = require('aws-sdk');
const config = require('./global_configuration');
class Generic_Extractor {


}
// Generic_Extractor.init = async ()=>{

//     let config = await new config.

// };


aws.config.update({
  accessKeyId: 'AKIAI534JVNP26WCQTXA',
  secretAccessKey: '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',
  region: 'us-east-2'
});

const fs = require('fs');

var rekognition = new aws.Rekognition({
  apiVersion: '2016-06-27'
});


var comprehend = new AWS.Comprehend({ apiVersion: '2017-11-27' });

// pull base64 representation of image from file system (or somewhere else)
class FileExtractor {

  constructor() {
    //this.file_name = file_name;
  }

  index(file_name) {
    let split = file_name.split('.');
    let file_type = split[split.length - 1];
    //text file
    if (file_type == 'txt') {

      return new Promise((resolve, reject) => {
        fs.readFile(file_name, 'utf8', (err, file_data) => {

          // create a new buffer out of the string passed to us by fs.readFile()
          var params = {
            LanguageCode: 'en', /* required */
            Text: file_data /* required */
          };


          comprehend.detectKeyPhrases(params, function (err, data) {
            if (err) {
              console.log(err, err.stack); // an error occurred
              reject("Error in API call");
            }
            else {
              //data = JSON.parse(data);
              let result = "";
              if (data) {
                data = data['KeyPhrases'];
                for (let i in data) {
                  result += data[i]["Text"] + " "; // extra space don't have impact on indexer
                }
              }
              let result_return = {"main_index":result,"secondary_index":file_data};
              resolve(result_return);

            }
          });

        });
      });
    }
    //assuming the image type. Should be improved this part
    else {

      return new Promise((resolve, reject) => {

        fs.readFile(file_name, 'base64', (err, data) => {

          // create a new buffer out of the string passed to us by fs.readFile()
          const buffer = new Buffer(data, 'base64');

          // now that we have things in the right type, send it to rekognition
          rekognition.detectLabels({
            Image: {
              Bytes: buffer
            }
          }).promise()
            .then((res) => {

              // print out the labels that rekognition sent back
              let data = res;//JSON.parse(res);
              let result = "";
              if (data) {
                data = data['Labels'];
                for (let i in data) {
                  result += data[i]["Name"] + " ";
                }
              }

              let result_return = {"main_index":result,"secondary_index":""};
              resolve(result_return);
              //resolve(result);

            }, (err) => {
              reject("");
            });

        });

      });
    }
  }
}


// due to time constraints modularization of code is not done.
exports.FileExtractor = FileExtractor;