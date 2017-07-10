<?php
/**

 *
 */

namespace OCA\Gallery;

use OCP\IDBConnection;


class FaceDb {
    
    private $db;
   
    public function __construct(IDBConnection $db) {
        $this->db = $db;
    }
    
   
    
    public function faceInsert($faceId, $faceness, $fileId, $userId, $path, $personId = '', $categories = '') {
        $query = $this->db->prepare('INSERT INTO `*PREFIX*faceImage` (`faceId`,`faceness`,`fileId`,`userId`,`filePath`,`personId`,`categories`) VALUES (?,?,?,?,?,?,?)');
        $result = $query->execute(array($faceId, $faceness, $fileId, $userId, $path, $personId, $categories));
            if (!$result) {
                \OCP\Util::writeLog('faceImage_db', 'face image database couldn\'t insert entry', \OCP\Util::ERROR);
            }        
    }
    
    /*
    public function findUserId($faceId, $userId ) {
         $query = \OC_DB::prepare('SELECT `userId` from `*PREFIX*faceImage` WHERE `faceId`=? AND `userId`=?');
         $result = $query->execute(array($faceId, $userId))->fetchAll();               
         if(isset($result[0]['userId'])) {
             return $result[0]['userId'];
         } else {
             return false;
         }
         
    } */

    public function faceFindFileId($faceId, $userId) {
         $query = $this->db->prepare('SELECT `fileId` from `*PREFIX*faceImage` WHERE `faceId`=? AND `userId`=?');
         $result = $query->execute(array($faceId, $userId))->fetchAll();
         if(isset($result[0]['fileId'])) {
             return $result[0]['fileId'];
         } else {
             return false;
         }                  
    } 
    
    public function faceFindFilePath($faceId, $userId) {
         $query =  $this->db->prepare('SELECT `filePath` from `*PREFIX*faceImage` WHERE `faceId`=? AND `userId`=?');
         $result = $query->execute(array($faceId, $userId))->fetchAll();
         if(isset($result[0]['filePath'])) {
             return $result[0]['filePath'];
         } else {
             return false;
         }                  
    }    
    
    public function faceDelete($faceId, $userId) {
        $query = $this->db->prepare('DELETE FROM `*PREFIX*faceImage` WHERE `faceId`=? AND `userId`=?');
        $result = $query->execute(array($faceId, $userId));
            if (!$result) {
                \OCP\Util::writeLog('faceImage_db', 'face image database couldn\'t delete entry', \OCP\Util::ERROR);
            }        
    }
    
    public function faceUpdatePersonId($personId, $faceId, $userId) {
        $query = $this->db->prepare('UPDATE `*PREFIX*faceImage` SET `personId`=?  WHERE `faceId`=? AND `userId`=?');
        $result = $query->execute(array($personId, $faceId, $userId));
            if (!$result) {
                \OCP\Util::writeLog('faceImage_db', 'face image database couldn\'t update personId', \OCP\Util::ERROR);
            }       
    }
    
    //return all file with certain personId
    public function faceFindFilePathByPersonId ($personId, $userId){
        $query = $this->db->prepare('SELECT `filePath` from `*PREFIX*faceImage` WHERE `personId`=? AND `userId`=?');
         $result = $query->execute(array($presonId, $userId));
         $array = array();
         while ($row = $result->fetchRow()) {   
            if(isset($row['filePath']))         
                array_push($array, $row['filePath']);                        
        }
        return $array;
    }
    
    //return all faceId with certain personId
    public function faceFindFaceIdByPersonId ($personId, $userId){
        $query = $this->db->prepare('SELECT `faceId` from `*PREFIX*faceImage` WHERE `personId`=? AND `userId`=?');
         $result = $query->execute(array($presonId, $userId));
         $array = array();
         while ($row = $result->fetchRow()) {   
            if(isset($row['faceId']))         
                array_push($array, $row['faceId']);                        
        }
        return $array;
    }
    

 //---------------------------------       
    public function personInsert($personId, $thumbnailName, $userId) {
        $query = $this->db->prepare('INSERT INTO `*PREFIX*personTag` (`personId`,`thumbnailName`,`userId`) VALUES (?,?,?)');
        $result = $query->execute(array($personId, $thumbnailName, $userId));
        if (!$result) {
            \OCP\Util::writeLog('personTag_db', 'person tag database couldn\'t insert entry', \OCP\Util::ERROR);
        }        
    }
    
    public function havePersonId($personId, $userId) {
        $query = $this->db->prepare('SELECT `id` from `*PREFIX*personTag` WHERE `personId`=? AND `userId`=?');
        $result = $query->execute(array($personId, $userId));
        if (isset($result[0]['id'])) 
            return True;
        else 
            return False;
    }
        
    public function personFindTag($personId, $userId) {
         $query = $this->db->prepare('SELECT `tag1` from `*PREFIX*personTag` WHERE `personId`=? AND `userId`=?');
         $result = $query->execute(array($personId, $userId))->fetchAll();
         $array = array();
         if(isset($result[0]['tag1'])) 
             array_push($array, $result[0]['tag1']);
         if(isset($result[0]['tag2'])) 
             array_push($array, $result[0]['tag2']);          
             
         return $array;
    }
    
    public function personUpdateTag1($personId, $tag1, $userId) {
         $query = $this->db->prepare('UPDATE `*PREFIX*personTag`  SET `tag1`=? WHERE `personId`=? AND `userId`=?');
         $result = $query->execute(array($tag1, $personId, $userId));
         if (!$result) {
            \OCP\Util::writeLog('personTag_db', 'person tag database couldn\'t update tag1', \OCP\Util::ERROR);
        }
    }
    
    public function personUpdateTag2($personId, $tag2, $userId) {
         $query = $this->db->prepare('UPDATE `*PREFIX*personTag`  SET `tag2`=? WHERE `personId`=? AND `userId`=?');
         $result = $query->execute(array($tag2, $personId, $userId));
         if (!$result) {
            \OCP\Util::writeLog('personTag_db', 'person tag database couldn\'t update tag2', \OCP\Util::ERROR);
        }
    }
    
    //return filePath+fileName
    public function personFindThumbnail($personId, $userId) {
         $query = $this->db->prepare('SELECT `thumbnailPath` from `*PREFIX*personTag` WHERE `personId`=? AND `userId`=?');
         $result = $query->execute(array($personId, $userId))->fetchAll();
         
         if(isset($result[0]['thumbnailPath']) && isset($result[0]['thumbnailName'])) 
             return $result[0]['thumbnailPath'].$result[0]['thumbnailName'];         
             
         return false;
    }
    
    public function personUpdateThumbnail($personId, $thumbnailName, $userId) {
        $query = $this->db->prepare('UPDATE `*PREFIX*personTag` SET `thumbnailName`=? WHERE `personId`=? AND `userId`=?');
        $result = $query->execute(array($thumbnailName, $personId, $userId));
        if (!$result) {
            \OCP\Util::writeLog('personTag_db', 'person tag database couldn\'t update personId', \OCP\Util::ERROR);
        }
    }
    
    public function personDelete($personId, $userId) {
        $query = $this->db->prepare('DELETE FROM `*PREFIX*personTag` WHERE `personId`=? AND `userId`=?');
        $result = $query->execute(array($personId, $userId));
            if (!$result) {
                \OCP\Util::writeLog('personTag_db', 'person tag database couldn\'t delete entry', \OCP\Util::ERROR);
            }        
    }
    
    //find all personId with same tag    
    public function personFindPersonIdByTag($tag, $userId) {
        $query = $this->db->prepare('SELECT `personId` from `*PREFIX*personTag` WHERE (`tag1`=? OR `tag2=?`) AND `userId`=?');
        $result = $query->execute(array($tag, $tag, $userId));                 
        $array = array();
        while ($row = $result->fetchRow()) {       
            if (isset($row['personId']))
                array_push($array, $row['personId']);                        
        }
        return $array;
        
    }
    
    
    //find all fileId with same tag    
    public function personFindAllFileIdByTag($tag, $userId) {
         $query = $this->db->prepare('SELECT `fileId` from `*PREFIX*faceImage,*PREFIX*personTag` WHERE'
                 . ' `*PREFIX*faceImage.personId`=`*PREFIX*personTag.personId`'
                 . ' AND (`*PREFIX*personTag.tag1`=? OR `*PREFIX*personTag.tag2`=?)'
                 . ' AND `*PREFIX*personTag.userId`=?');
         $result = $query->execute(array($tag, $tag, $userId));                 
         $array = array();
         while ($row = $result->fetchRow()) {       
            if (isset($row['fileId']))
                array_push($array, $row['fileId']);                        
        }
        return $array;
    }
    

    
}