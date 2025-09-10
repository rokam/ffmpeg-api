var express = require('express')
const ffmpeg = require('fluent-ffmpeg');

const constants = require('../constants.js');
const logger = require('../utils/logger.js')
const utils = require('../utils/utils.js')

var router = express.Router();

router.post('/audio/:speed', function (req, res,next) {
    res.locals.type="audio";
    return speed(req,res,next);
});

router.post('/audio/:speed/mp3', function (req, res,next) {
    res.locals.type="audio";
    res.locals.format="mp3";
    return speed(req,res,next);
});

router.post('/audio/:speed/wav', function (req, res,next) {
    res.locals.type="audio";
    res.locals.format="wav";
    return speed(req,res,next);
});

router.post('/audio/:speed/ogg', function (req, res,next) {
    res.locals.type="audio";
    res.locals.format="ogg";
    return speed(req,res,next);
});

// shrink audio or video or image file
function speed(req,res,next) {
    let type = res.locals.type;
    let format = res.locals.format;
    if (!format) {
        format = utils.getFileExtension(res.locals.savedFile);
    }
    let speed = parseFloat(req.params.speed);
    if (isNaN(speed) || speed <= 0) {
        return next(new Error("Invalid speed parameter"));
    }
    logger.debug(`type: ${type} as ${format} at speed ${speed}x`);
    let ffmpegParams ={
        extension: format
    };

    ffmpegParams.outputOptions= [`-filter:a atempo=${speed}`];
    if (type == "audio")
    {
        if (format === "mp3")
        {
            ffmpegParams.outputOptions.push('-codec:a libmp3lame' );
        }
    }
    let savedFile = res.locals.savedFile;
    let outputFile = savedFile + '-output.' + ffmpegParams.extension;
    logger.debug(`begin conversion from ${savedFile} to ${outputFile}`)

    //ffmpeg processing... converting file...
    let ffmpegConvertCommand = ffmpeg(savedFile);
    ffmpegConvertCommand
            .renice(constants.defaultFFMPEGProcessPriority)
            .outputOptions(ffmpegParams.outputOptions)
            .on('error', function(err) {
                logger.error(`${err}`);
                utils.deleteFile(savedFile);
                res.writeHead(500, {'Connection': 'close'});
                res.end(JSON.stringify({error: `${err}`}));
            })
            .on('end', function() {
                utils.deleteFile(savedFile);
                return utils.downloadFile(outputFile,null,req,res,next);
            })
            .save(outputFile);
    
}

module.exports = router