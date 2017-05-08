<?php
/**
* When customers trying to input the person's any keys of name in the search list,
* the client will call this file and return the suggestion. 
* 1. when the tag in the server, return this person's face image.
*    ex: input 'J', return "Jack.jpg", "Jerry.gjp" face image.
* 2. When the tag not in the server, return all the untaged face image.
*    ex: input 'M', return "??201703021111.jpg","??201703021112.jpg"...
*    These images with no tagged was created when upload files, but couldn't link 
*    the faceId to personId. Customer should tag it later. Otherwise, we should 
*    keep the tag in this style('??'+'random number' ).    
*    
* URL:
* "server IP/apps/files/ajax/facesuggest.php" + "?suggest=" + "str"
* 
**/

/*find the person's face image, the file should be personId.face.jpg*/
function getFile($dir, $ext="face.jpg"){
    $dp = opendir($dir);
    $fileArr = array();
    while (!false == $curFile = readdir($dp)) {
        if ($curFile!="." && $curFile!=".." && $curFile!="") {
            if (is_dir($curFile)) {
               $fileArr = getFile($dir."/".$curFile);
            } else {
                $file_parts = explode('.',$file); 
                $file_ext1 = strtolower(array_pop($file_parts));
                $file_ext2 = strtolower(array_pop($file_parts));  
                if ($file_ext1 === 'jpg' && $file_ext2 === 'face') {
                    array_push($fileArr, $file); 
                }                                                                     
            }
        }
    }
    closedir($dir);
    return $fileArr;
}

// Check if we are a user
OCP\User::checkLoggedIn();
\OC::$server->getSession()->close();
$l = \OC::$server->getL10N('files');
     
//get the suggest parameter form url
$suggest = $_GET["suggest"];

// Load the files
$dir = isset($_GET['dir']) ? (string)$_GET['dir'] : '';
$dir = \OC\Files\Filesystem::normalizePath($dir);
  
if(strlen($suggest) > 0) {   
    try {
        $dirInfo = \OC\Files\Filesystem::getFileInfo($dir);
        if (!$dirInfo || !$dirInfo->getType() === 'dir') {
            header("HTTP/1.0 404 Not Found");
            exit();
        }            
        
        $data = array();
        $baseUrl = OCP\Util::linkTo('files', 'index.php') . '?dir=';
        
        $permissions = $dirInfo->getPermissions();
      
        //not used in currently
        //$sortAttribute = isset($_GET['sort']) ? (string)$_GET['sort'] : 'name';
        //$sortDirection = isset($_GET['sortdirection']) ? ($_GET['sortdirection'] === 'desc') : false;
        //$mimetypeFilters = isset($_GET['mimetypes']) ? json_decode($_GET['mimetypes']) : '';
        
        $files = [];
        
        
      
      
    } catch (\OCP\Files\StorageNotAvailableException $e) {
        \OCP\Util::logException('files', $e);
        OCP\JSON::error(array(
            'data' => array(
                'exception' => '\OCP\Files\StorageNotAvailableException',
                'message' => $l->t('Storage not available')
            )
        ));
    } catch (\OCP\Files\StorageInvalidException $e) {
        \OCP\Util::logException('files', $e);
        OCP\JSON::error(array(
            'data' => array(
                'exception' => '\OCP\Files\StorageInvalidException',
                'message' => $l->t('Storage invalid')
            )
        ));
    } catch (\Exception $e) {
        \OCP\Util::logException('files', $e);
        OCP\JSON::error(array(
            'data' => array(
                'exception' => '\Exception',
                'message' => $l->t('Unknown error')
            )
        ));
}
  
  
?>
