<?php
if ($_FILES['file']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = __DIR__ . '/uploads/';
    $thumbDir = __DIR__ . '/thumbs/';

    if (!file_exists($uploadDir)) mkdir($uploadDir, 0777, true);
    if (!file_exists($thumbDir)) mkdir($thumbDir, 0777, true);

    $filename = basename($_FILES['file']['name']);
    $filepath = $uploadDir . $filename;
    move_uploaded_file($_FILES['file']['tmp_name'], $filepath);

    // Generate thumbnail (max 450x450)
    $thumbPath = $thumbDir . 'thumb_' . $filename;

    $imagick = new Imagick($filepath);
    $imagick->setImageFormat("jpeg");
    $imagick->thumbnailImage(450, 450, true);
    $imagick->writeImage($thumbPath);
    $imagick->clear();

    echo json_encode(['thumbnail' => 'thumbs/thumb_' . $filename]);
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Upload failed']);
}
