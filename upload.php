<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['file'])) {
  $file = $_FILES['file'];
  $uploadDir = __DIR__ . '/uploads/';
  $thumbDir = __DIR__ . '/thumbs/';

  if (!file_exists($uploadDir)) mkdir($uploadDir, 0777, true);
  if (!file_exists($thumbDir)) mkdir($thumbDir, 0777, true);

  $filename = basename($file['name']);
  $targetPath = $uploadDir . $filename;

  if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    try {
      $imagick = new Imagick($targetPath);
      $imagick->setIteratorIndex(0); // For multi-page files like PDF or TIFF
      $imagick->setImageFormat("jpeg");
      $imagick->setImageBackgroundColor('white');
      $imagick = $imagick->flattenImages();

      // Resize thumbnail to max 450x450 while maintaining aspect ratio
      $imagick->thumbnailImage(450, 450, true);

      $thumbPath = $thumbDir . pathinfo($filename, PATHINFO_FILENAME) . '_thumb.jpg';
      $imagick->writeImage($thumbPath);

      // Get original image dimensions
      $originalImage = new Imagick($targetPath);
      $dimensions = $originalImage->getImageGeometry();
      $width = $dimensions['width'];
      $height = $dimensions['height'];

      $response = [
        'success' => true,
        'fileName' => $filename,
        'fileSizeMB' => round(filesize($targetPath) / 1024 / 1024, 2),
        'thumbnailUrl' => 'thumbs/' . basename($thumbPath),
        'imageWidth' => $width,
        'imageHeight' => $height,
      ];
    } catch (Exception $e) {
      $response = [
        'success' => false,
        'error' => 'Imagick error: ' . $e->getMessage()
      ];
    }
  } else {
    $response = [
      'success' => false,
      'error' => 'File upload failed.'
    ];
  }
} else {
  $response = [
    'success' => false,
    'error' => 'No file uploaded.'
  ];
}

header('Content-Type: application/json');
echo json_encode($response);
