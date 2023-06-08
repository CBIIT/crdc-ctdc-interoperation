const { randomUUID } = require("crypto");
const fs = require("fs").promises;
const os = require("os");
const path = require("path");
const { getSignedUrl } = require("@aws-sdk/cloudfront-signer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { convertObjectArrayToCsv } = require("../util/array-util");
const config = require("../config");

// uploads a manifest CSV to S3 and returns a signed CloudFront URL
async function uploadManifestToS3(parameters) {
  console.log("STORE MANIFEST RESOLVER CALLED!");
  try {
    const s3Client = new S3Client({
      region: config.AWS_REGION,
      credentials: {
        accessKeyId: config.S3_ACCESS_KEY_ID,
        secretAccessKey: config.S3_SECRET_ACCESS_KEY,
      },
    });
    console.log("S3 CLIENT INITIALIZED!");

    const manifestCsv = convertObjectArrayToCsv(parameters.manifest);
    console.log("MANIFEST CSV:  ", manifestCsv);
    const tempCsvFile = `${randomUUID()}.csv`;
    const tempCsvFilePath = path.join(os.tmpdir(), tempCsvFile);
    await fs.writeFile(tempCsvFilePath, manifestCsv, {
      encoding: "utf-8",
    });
    console.log("TEMP MANIFEST CSV WRITTEN!");

    const uploadParams = {
      Bucket: config.FILE_MANIFEST_BUCKET_NAME,
      Key: tempCsvFile,
      Body: await fs.readFile(tempCsvFilePath, { encoding: "utf-8" }),
    };
    const uploadCommand = new PutObjectCommand(uploadParams);
    await s3Client.send(uploadCommand);
    console.log("OBJECT UPLOADED TO S3 BUCKET!");

    return getSignedUrl({
      keyPairId: config.CLOUDFRONT_KEY_PAIR_ID,
      privateKey: config.CLOUDFRONT_PRIVATE_KEY,
      url: `${config.CLOUDFRONT_DOMAIN}/${tempCsvFile}`,
      dateLessThan: new Date(
        Date.now() + 1000 * config.SIGNED_URL_EXPIRY_SECONDS
      ),
    });
  } catch (error) {
    console.log("ERROR UPLOADING TO S3 BUCKET!");
    console.error(error);
    return error;
  }
}

module.exports = { uploadManifestToS3 };
