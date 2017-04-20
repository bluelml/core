<?php

/*
    Reference PHP API design for SnowSense face recognition web service
    Created on 3/30/2017
    @author: SnowSense
    Ver 0.1
    Note: must have PHP Version ^5.5 and enable cUrl module.
*/

require_once("conf.php");


/*
Use PHP cUrl module to Post data / file to url
:param url: string, URL string to post
:param data: array, data for post , include FILE
:param upfile : bol, upload a file or not
:return :if success,  Server response
         on error, false
*/
function postData($url,$data=array(),$upfile = false){
    $ch = curl_init();
    if($upfile){
        curl_setopt($ch, CURLOPT_SAFE_UPLOAD, true);
    }else{
        $data = http_build_query($data);
    }
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HEADER, 0);
    curl_setopt($ch, CURLOPT_TIMEOUT,10);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS,$data );

    $output = curl_exec($ch);
    $errorCode = curl_errno($ch);
    curl_close($ch);

    if(0 !== $errorCode) {
        return (false);
    }
    return ($output);
}


/*
Use PHP cUrl module to get Data from url
:param url: string, URL string to post
:return :if success,  Server response
         on error, false
*/
function getUrl($url){
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HEADER, 0);
    curl_setopt($ch, CURLOPT_TIMEOUT,10);

    $output = curl_exec($ch);
    $errorCode = curl_errno($ch);
    curl_close($ch);

    if(0 !== $errorCode) {
        return (false);
    }
    return ($output);
}

/*
 A helping function generating API URL string for a given API name.

:param api_name: string; the API name
:return: API URL string

*/
function _get_api_url($api_name){
    global $conf;
    $api_Url = $conf["SERVER"] . $api_name;
    $api_key = $conf['API_KEY'];
    $api_secret = $conf['API_SECRET'];

    $api_Url .='?apikey=' . urlencode($api_key);

    return($api_Url);
}


/*
Check if the input string is a valid URL.

:param url: a URL string to check
:return: True or False
*/
function _is_valid_url($url){
    $regex = '@(?i)\b((?:[a-z][\w-]+:(?:/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:\'".,<>?«»“”‘’]))@';
    return(preg_match($regex,$url));
}


/*
Add a person's name and ID to the web service.

:param name: person's name (string)
:param person_id: a person ID (string)
:return:
*/
function add_person($name,$person_id = ''){
    $url = _get_api_url('addperson');

    $data = array('name' => $name);

    if($person_id != ''){
        $data['personId'] = $person_id;
    }

    $res_obj = postData($url,$data);
    return ($res_obj);

}


/*
Detect all faces in one image

:param image_path: a local image path
:return: a json string
    Example:
    {'faces': [{'bottom': 270,
       'faceId': 'face_1ceae97e-16aa-11e7-b31b-0242ac120003',
       'faceness': 1.9446442760957594,
       'imageHeight': 610,
       'imageWidth': 920,
       'left': 581,
       'right': 617,
       'top': 234},
      ......
      {'bottom': 270,
       'faceId': 'face_1ceaf536-16aa-11e7-b31b-0242ac120003',
       'faceness': 0.7359679378999586,
       'imageHeight': 610,
       'imageWidth': 920,
       'left': 709,
       'right': 745,
       'top': 234}]}
*/
function detect_face_local($image_path){
    $url = _get_api_url('facedetect');
    if(realpath($image_path) !== false){
        $data = array('image' => new CURLFile(realpath($image_path)));
        //var_dump($data);
        $res_obj = postData($url,$data,true);
        return ($res_obj);
    }else{
        return(false);
    }
}

/*
Detect all faces in one image

:param image_path: image url
:return: a json string
    Example:
    {'faces': [{'bottom': 270,
       'faceId': 'face_1ceae97e-16aa-11e7-b31b-0242ac120003',
       'faceness': 1.9446442760957594,
       'imageHeight': 610,
       'imageWidth': 920,
       'left': 581,
       'right': 617,
       'top': 234},
      ......
      {'bottom': 270,
       'faceId': 'face_1ceaf536-16aa-11e7-b31b-0242ac120003',
       'faceness': 0.7359679378999586,
       'imageHeight': 610,
       'imageWidth': 920,
       'left': 709,
       'right': 745,
       'top': 234}]}
*/
function detect_face_url($image_url){
    $url = _get_api_url('facedetect');
//    if(_is_valid_url($image_url) !== false){
        $data = array('im_uri' => $image_url);
        $url .='&' . http_build_query($data);
        $res_obj = getUrl($url);
        return ($res_obj);
//    }else{
//        return(false);
//    }
}

/*
Compare two faces specified by two face IDs.
Face ID is an unique face ID stored in the web service; each face region has one unique face ID.

:param face_id1: face ID 1;
:param face_id2: face ID 2; unique face ID stored in the web service; each face region has one unique face ID
:return: a json string
    Example:  {'samePerson': False, 'similarity': 0.06835506118690104}
*/
function compare_face($face_id1='', $face_id2=''){
    $api_str = "facecompare/{$face_id1}/{$face_id2}";
    $url = _get_api_url($api_str);
    $res_obj = getUrl($url);
    return ($res_obj);
}

/*
Identify the person by face given by face ID

:param face_id: unique face ID stored in the web service; each face region has one unique face ID
:return: a json string
    Example:
    {'identified': False,
     'maxSimilarity': 0.6239015522991999,
     'mostSimilarPersonId': 'ABC Name',
     'mostSimilarPersonName': 'ABC Name',
     'runnerUp': {'name': 'ABC Name',
     'personId': 'ABC Name',
     'similarity': 0.6227304127331807}}
*/
function identify_face($face_id){
    $api_str = "faceidentify/{$face_id}";
    $url = _get_api_url($api_str);

    $res_obj = getUrl($url);
    return ($res_obj);
}


/*
Link a person to a face. Also known as 'label a face'.

:param person_id: person ID given by user
:param face_id: unique face ID stored in the web service; each face region has one unique face ID

:return: A json string
    Example:  {'success': True}
*/
function link_person_to_face($person_id, $face_id){
    $url = _get_api_url('labelface');
    $data = array('faceId' => $face_id ,'personId' => $person_id);

    $res_obj = postData($url, $data);
    return ($res_obj);
}

/*
Use 'person_id' to find all face IDs associated (linked) with this person in the system.

:param person_id: person ID given by user
:return: A json string
    Example:
    [{'faceId': 'face_d8a68c48-0649-11e7-9e73-0242ac120003',
      'personId': 'Person Name'},
     .................
     {'faceId': 'face_d372c18c-16ad-11e7-b31b-0242ac120003',
      'personId': 'Person Name'}]
*/
function find_person_labels($person_id){
    $api_str = "person/{$person_id}/facelabels";
    $url = _get_api_url($api_str);
    $res_obj = getUrl($url);

    return ($res_obj);
}

function api_detect_face($input_file) {
    $res_obj = detect_face_local($input_file);
    return($res_obj);
}

?>
