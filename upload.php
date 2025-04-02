<?php
file_put_contents('log.txt', print_r($_FILES, true), FILE_APPEND);

header('Content-Type: application/json');

$targetDir = __DIR__ . '/uploads/';
$thumbDir = __DIR__ . '/thumbnails/';

// Ensure directories exist
if (!is_dir($targetDir)) mkdir($targetDir, 0777, true);
if (!is_dir($thumbDir)) mkdir($thumbDir, 0777, true);

// Check for upload errors
if ($_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $errorCode = $_FILES['file']['error'];
    $errorMessages = [
        UPLOAD_ERR_INI_SIZE   => 'The uploaded file exceeds the upload_max_filesize directive in php.ini.',
        UPLOAD_ERR_FORM_SIZE  => 'The uploaded file exceeds the MAX_FILE_SIZE directive in the HTML form.',
        UPLOAD_ERR_PARTIAL    => 'The uploaded file was only partially uploaded.',
        UPLOAD_ERR_NO_FILE    => 'No file was uploaded.',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder.',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
        UPLOAD_ERR_EXTENSION  => 'File upload stopped by extension.',
    ];
    $message = $errorMessages[$errorCode] ?? 'Unknown upload error.';
    echo json_encode(['success' => false, 'error' => $message]);
    exit;
}

$file = $_FILES['file'];
$originalName = basename($file['name']);
$ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

// Allowed MIME types based on Imagick support and your requirements
$allowedTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'image/tiff',
    'image/heic',
    'image/x-adobe-dng',      // DNG support added here
    'image/x-sony-arw',
    'image/x-canon-cr2',
    'image/x-nikon-nef',
    'image/vnd.adobe.photoshop',
    'image/x-photoshop',
    'application/octet-stream',
    'image/x-targa'
];


// Validate MIME type using finfo
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']);

if (!in_array($mime, $allowedTypes)) {
    echo json_encode(['success' => false, 'error' => 'Unsupported file type (' . $mime . ')']);
    exit;
}

$filename = uniqid('img_', true) . '.' . $ext;
$targetFile = $targetDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $targetFile)) {
    echo json_encode(['success' => false, 'error' => 'Failed to save file']);
    exit;
}

$fullPath = __DIR__ . '/uploads/' . $filename;

try {
    $thumb = new Imagick();
    $readSuccess = @$thumb->readImage($fullPath . '[0]');

    if (!$readSuccess || $thumb->getNumberImages() === 0) {
        throw new Exception('Imagick could not read the file or contains no pages.');
    }
    $width = $thumb->getImageWidth();
    $height = $thumb->getImageHeight();

    $thumb->setImageFormat('jpeg');
    $thumb->setImageCompression(Imagick::COMPRESSION_JPEG);
    $thumb->setImageCompressionQuality(60);
    $thumb->thumbnailImage(450, 450, true);

    $thumbnailName = pathinfo($filename, PATHINFO_FILENAME) . '.jpg';
    $thumbnailPath = $thumbDir . $thumbnailName;
    $thumb->writeImage($thumbnailPath);
    $thumb->clear();
    $thumb->destroy();

    echo json_encode([
        'success' => true,
        'thumbnail' => 'thumbnails/' . $thumbnailName,
        'filesize' => filesize($fullPath),
        'width' => $width,
        'height' => $height
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Thumbnail creation failed: ' . $e->getMessage()
    ]);
}
