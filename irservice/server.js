const express = require('express');
const file_upload = require('express-fileupload');
const integrator = require('./integrator');
var app = express();


app.use(file_upload());

/**
 * File upload functions below
 * The format of file "{user}__{context}___{time_stamp}__{file_name}"
 */
app.post('/content/:context*?', function (req, res) {

    let file = req.files.file;
    let context = req.params.context || 'default_context';
    let actual_filename = file.name;
    let user_name = "default_user"; // should be from jwt token
    let time_stamp = new Date().getTime();

    let file_name = "upload/" + user_name + "__" + context + "__" + time_stamp + "__" + actual_filename;
    file.mv(file_name, function (err, data) {
        console.log("upladed file " + file_name);
        if (!err) {
            integrator.add_new_file(actual_filename, file_name);
            res.status(200);
            res.send();
        }
        else {
            res.status(500);
            res.send();
        }
    });

});
/*
 Search 
*/

app.get("/search", (req, res) => {

    let query_text = req.query.query;
    integrator.serach(query_text, res).then(() => {
        console.log("Served Query: " + query_text);
    });
}
);


/*
 Get file by file id from s3
*/
app.get("/content/:file_id", (req, res) => {

    integrator.get_file_byid(req.params.file_id, res);
});
/*
 Test server
*/
app.get("/hello", (req, res) => {
    res.status(200);
    res.send("Hello from us!!!")
});


app.listen(8080, (err, data) => {
    if (!err) {
        console.log("listening 8080")
    }
    else {
        4
        console.log("Error in startup");
    }
})