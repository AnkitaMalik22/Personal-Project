const { v2: cloudinary } = require("cloudinary");

exports.uploadPicture = async (file,folder) => {
    try {
    
    
      // Iterate over uploaded files
        const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: folder,
        filename_override: file.name,
        resource_type: "image",
      });
      // console.log(result);
      return result;
    //   url: file.url,
    //       name: file.original_filename,
    //       format: file.format,
    //       size: file.bytes,
   
    } catch (error) {
      
      return error;
    }
  };