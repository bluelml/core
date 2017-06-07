/* global Album, GalleryImage */
(function ($, OC, t) {
	"use strict";
	var Gallery = {
		currentAlbum: null,
		currentEtag: null,
		config: {},
		/** Map of the whole gallery, built as we navigate through folders */
		albumMap: {},
		/** Used to pick an image based on the URL */
		imageMap: {},
		appName: 'gallery',
		token: undefined,
		activeSlideShow: null,
		buttonsWidth: 600,
		browserToolbarHeight: 150,
		filesClient: null,
        faceflag : false,
        /*files_id is a global array that store files_id about face pictures*/
        files_id : new Array(),
        /*image_result is a global variable that store pictures about faces */
        image_result : 0, 
		/**
		 * Refreshes the view and starts the slideshow if required
		 *
		 * @param {string} path
		 * @param {string} albumPath
		 */
		refresh: function (path, albumPath) {
			if (Gallery.currentAlbum !== albumPath) {
				Gallery.view.init(albumPath, null);
			}

			// If the path is mapped, that means that it's an albumPath
			if (Gallery.albumMap[path]) {
				if (Gallery.activeSlideShow) {
					Gallery.activeSlideShow.stop();
				}
			} else if (Gallery.imageMap[path] && Gallery.activeSlideShow.active === false) {
				Gallery.view.startSlideshow(path, albumPath);
			}
		},

		/**
		 * Retrieves information about all the images and albums located in the current folder
		 *
		 * @param {string} currentLocation
		 *
		 * @returns {*}
		 */
		getFiles: function (currentLocation) {
			// Cache the sorting order of the current album before loading new files
			if (!$.isEmptyObject(Gallery.albumMap)) {
				Gallery.albumMap[Gallery.currentAlbum].sorting = Gallery.config.albumSorting;
			}
			// Checks if we've visited this location before ands saves the etag to use for
			// comparison later
			var albumEtag;
			var albumCache = Gallery.albumMap[decodeURIComponent(currentLocation)];
			if (!$.isEmptyObject(albumCache)) {
				albumEtag = albumCache.etag;
			}

			// Sends the request to the server
			var params = {
				location: currentLocation,
				mediatypes: Gallery.config.getMediaTypes(),
				features: Gallery.config.getFeatures(),
				etag: albumEtag
			};
			// Only use the folder as a GET parameter and not as part of the URL
			var url = Gallery.utility.buildGalleryUrl('files', '/list', params);
			return $.getJSON(url).then(
				function (/**@type{{
					* files:Array,
					* albums:Array,
					* albumconfig:Object,
					* albumpath:String,
					* updated:Boolean}}*/
						  data) {
					var albumpath = data.albumpath;
					var updated = data.updated;
					// FIXME albumConfig should be cached as well
					/**@type {{design,information,sorting,error: string}}*/
					var albumConfig = data.albumconfig;
					//Gallery.config.setAlbumPermissions(currentAlbum);
					Gallery.config.setAlbumConfig(albumConfig, albumpath);
					// Both the folder and the etag have to match
					if ((decodeURIComponent(currentLocation) === albumpath) &&
						(updated === false)) {
						Gallery.imageMap = albumCache.imageMap;
					} else {
						Gallery._mapFiles(data);
					}

					// Restore the previous sorting order for this album
					if (!$.isEmptyObject(Gallery.albumMap[albumpath].sorting)) {
						Gallery.config.updateAlbumSorting(
							Gallery.albumMap[albumpath].sorting);
					}

				}, function (xhr) {
					var result = xhr.responseJSON;
					var albumPath = decodeURIComponent(currentLocation);
					var message;
					if (result === null) {
						message = t('gallery', 'There was a problem reading files from this album');
					} else {
						message = result.message;
					}
					Gallery.view.init(albumPath, message);
					Gallery._mapStructure(albumPath);
				});
		},

		/**
		 * Sorts albums and images based on user preferences
		 */
		sorter: function () {
			var sortType = 'name';
			var sortOrder = 'asc';
			var albumSortType = 'name';
			var albumSortOrder = 'asc';
			if (this.id === 'sort-date-button') {
				sortType = 'date';

			}
			var currentSort = Gallery.config.albumSorting;
			if (currentSort.type === sortType && currentSort.order === sortOrder) {
				sortOrder = 'des';
			}

			// Update the controls
			Gallery.view.sortControlsSetup(sortType, sortOrder);

			// We can't currently sort by album creation time
			if (sortType === 'name') {
				albumSortOrder = sortOrder;
			}

			// FIXME Rendering is still happening while we're sorting...

			// Clear before sorting
			Gallery.view.clear();

			// Sort the images
			Gallery.albumMap[Gallery.currentAlbum].images.sort(Gallery.utility.sortBy(sortType,
				sortOrder));
			Gallery.albumMap[Gallery.currentAlbum].subAlbums.sort(
				Gallery.utility.sortBy(albumSortType,
					albumSortOrder));

			// Save the new settings
			var sortConfig = {
				type: sortType,
				order: sortOrder,
				albumOrder: albumSortOrder
			};
			Gallery.config.updateAlbumSorting(sortConfig);

			// Refresh the view
			Gallery.view.viewAlbum(Gallery.currentAlbum);
		},

        /*request searching*/
        getSearch: function () {
            // Sends the request to the server
            $('#face_display>div').remove();
            $('#face_display>input').remove();
            $('#face_display>p').remove();
            $('#face_display>span').remove();
            var baseUrl = OC.generateUrl('apps/gallery/files/suggest/');

            if (($('#face-input').val().length) === 0){
                URL = baseUrl + "**1**" + '?' + "search=" + "**1**";
            }
            else{
                URL = baseUrl + $('#face-input').val() + '?' + "search=" + $('#face-input').val();
            }
            $.ajax ({
                type: 'GET',
                url: URL,
                dataType : 'json',
                beforeSend:function(){
                $('#face-input').attr({"disabled":"disabled"});
                $('#face-button').attr({"disabled":"disabled"});    
                }, 
                success : function(data){
                    //alert(data);
                    $('#face-input').removeAttr("disabled");
                    $('#face-button').removeAttr("disabled");                    
                    $('#face_display>p').remove();
                    Gallery.get_face_imge(data); 
                },
                error : function(data) {
                    $('#face-input').removeAttr("disabled");
                    $('#face-button').removeAttr("disabled");
                    alert("请输入需要查询的id");         
                }
                
            }); 
            
        },
                /*received facelist and post faceimge request*/
        get_face_imge: function(list) {
            var face_list = list;
            var i ;
            if(face_list.length <= 0)
                return false;
            var params = {
                face_list: face_list.join(';')
            };
            var url =Gallery.utility.buildGalleryUrl('faceThumbnails', '', params);
            var eventSource = new Gallery.EventSource(url);
                eventSource.listen('preview',function (/**{filesname, status, mimetype, preview}*/ preview) {
                /*Create a Label 'div' to incase 'input image' as face*/   
                    var block_image = document.createElement("div");
                    var bigImg = document.createElement("input");
                    var name_tag = document.createElement("p");
                     // block_image.style = "display: inline-block";
                      block_image.className = "block_style";
                      bigImg.setAttribute("type","image"); 
                      bigImg.setAttribute("class","face");   
                      bigImg.src=('data:' + preview.mimetype + ';base64,' + preview.preview);
                      block_image.setAttribute("id",preview.filesname); 
                      block_image.setAttribute("name",preview.name);
                      name_tag.innerHTML = preview.name;
                      name_tag.className = "text_style";
                      name_tag.setAttribute("style","display: none");
                    var myDiv = document.getElementById('face_display'); 
                      myDiv.appendChild(block_image);                      
                      block_image.appendChild(bigImg);
                      block_image.appendChild(name_tag);                       
                });
             
                
        },
        get_result: function(){
                    /*clear Label 'p' at id:'face_display'*/
                    $('#face_display>p').remove();
                    $('#face_display>span').remove();
                    /*clear Label 'div' unless clicked one*/
                    $(this).siblings().remove();
                    var personID = $(this).attr("id");
                    var name = $(this).attr("name");
                    /*creat Label 'p'*/
                    var prefile = document.createElement("p");
                        prefile.innerHTML = name;
                        var myDiv = document.getElementById('face_display');
                        myDiv.appendChild(prefile);
                    var static_name = document.createElement("span");
                        static_name.innerHTML = "NewName:  ";
                        myDiv.appendChild(static_name);
                    var name_edit = document.createElement("input");
                        name_edit.type = 'text';
                        name_edit.placeholder = 'name or personID';
                        myDiv.appendChild(name_edit);
                    var button = document.createElement("input");
                        button.type = 'button';
                        button.value = '修改'  ;
                        myDiv.appendChild(button);
                              
                    var params = {
                    personID: personID
                    };
                    var url =Gallery.utility.buildGalleryUrl('files', '/person', params);
                    $.ajax ({
                        type: 'GET',
                        url: url,
                        dataType : 'json', 
                        success : function(data){
                            var i,fileslength = data.files.length;
                            /*Clear array files_id*/
                            Gallery.files_id = [];
                            for(i=0;i<fileslength;i++){
                                 Gallery.files_id[i]= data.files[i].id;
                            }
                            /*Change faceflag to true */   
                            Gallery.faceflag = true; 
                            var albumPath = "";
                            Gallery.view.viewAlbum(albumPath);     
                                },
                        error : function(data) {
                                alert(data);         
                                }
                                
                
            });
        },
        
        set_personID: function(){
            var newName = $("#face_display").children(":text").val();
            var oldName = $("#face_display").children("div").attr("name");
            var personID = $("#face_display").children("div").attr("id"); 
            var params = {
                    newName: newName,
                    oldName: oldName,
                    personID: personID
                    };
                    var url =Gallery.utility.buildGalleryUrl('files', '/setName', params);
                    $.ajax ({
                        type: 'GET',
                        url: url,
                        dataType : 'json', 
                        success : function(data){                    
                                alert(data); 
                                },
                        error : function(data) {
                                alert(data);         
                                }
                
            });
        },
        
        set_mouseover: function(){
            /*set tag when mouse foucsed on image*/
            $(this).children("p").remove();
            var personID = $(this).attr("id");
            var name_tag = document.createElement("p");
                    name_tag.innerHTML = $(this).attr("name");
                    name_tag.className = "text_style";
                    name_tag.setAttribute("style","display: block");
                    document.getElementById(personID).appendChild(name_tag);    
        },
        
        set_mouseleave: function(){
            $(this).children("p").remove();
        },
        
        Enter_key_up : function(){
            var e = window.event || arguments.callee.caller.arguments[0];
            if (e && e.keyCode == 13 ) {
             Gallery.getSearch();
         }
        },
        
		/**
		 * Switches to the Files view
		 *
		 * @param event
		 */
		switchToFilesView: function (event) {
			event.stopPropagation();

			var subUrl = '';
			var params = {path: '/' + Gallery.currentAlbum};
			if (Gallery.token) {
				params.token = Gallery.token;
				subUrl = 's/{token}?path={path}';
			} else {
				subUrl = 'apps/files?dir={path}';
			}

			var button = $('#filelist-button');
			button.children('#button-loading').addClass('loading');
			OC.redirect(OC.generateUrl(subUrl, params));
		},

		/**
		 * Populates the share dialog with the needed information
		 *
		 * @param event
		 */
		share: function (event) {
			// Clicking on share button does not trigger automatic slide-up
			$('.album-info-container').slideUp();

			if (!Gallery.Share.droppedDown) {
				event.preventDefault();
				event.stopPropagation();

				var currentAlbum = Gallery.albumMap[Gallery.currentAlbum];
				$('a.share').data('path', currentAlbum.path)
					.data('link', true)
					.data('item-source', currentAlbum.fileId)
					.data('possible-permissions', currentAlbum.permissions)
					.click();
				if (!$('#linkCheckbox').is(':checked')) {
					$('#linkText').hide();
				}
			}
		},

		/**
		 * Sends an archive of the current folder to the browser
		 *
		 * @param event
		 */
		download: function (event) {
			event.preventDefault();

			var path = $('#content').data('albumname');
			var files = Gallery.currentAlbum;
			var downloadUrl = Gallery.utility.buildFilesUrl(path, files);

			OC.redirect(downloadUrl);
		},

		/**
		 * Shows an information box to the user
		 *
		 * @param event
		 */
		showInfo: function (event) {
			event.stopPropagation();
			Gallery.infoBox.showInfo();
		},

		/**
		 * Lets the user add the shared files to his ownCloud
		 */
		showSaveForm: function () {
			$(this).hide();
			$('.save-form').css('display', 'inline');
			$('#remote_address').focus();
		},

		/**
		 * Sends the shared files to the viewer's ownCloud
		 *
		 * @param event
		 */
		saveForm: function (event) {
			event.preventDefault();

			var saveElement = $('#save');
			var remote = $(this).find('input[type="text"]').val();
			var owner = saveElement.data('owner');
			var name = saveElement.data('name');
			var isProtected = saveElement.data('protected');
			Gallery._saveToOwnCloud(remote, Gallery.token, owner, name, isProtected);
		},

		/**
		 * Creates a new slideshow using the images found in the current folder
		 *
		 * @param {Array} images
		 * @param {string} startImage
		 * @param {boolean} autoPlay
		 *
		 * @returns {boolean}
		 */
		slideShow: function (images, startImage, autoPlay) {
			if (startImage === undefined) {
				OC.Notification.showTemporary(t('gallery',
					'Aborting preview. Could not find the file'));
				return false;
			}
			var start = images.indexOf(startImage);
			images = images.filter(function (image, index) {
				// If the slideshow is loaded before we get a thumbnail, we have to accept all
				// images
				if (!image.thumbnail) {
					return image;
				} else {
					if (image.thumbnail.valid) {
						return image;
					} else if (index < images.indexOf(startImage)) {
						start--;
					}
				}
			}).map(function (image) {
				var name = OC.basename(image.path);
				var previewUrl = Gallery.utility.getPreviewUrl(image.fileId, image.etag);
				var params = {
					c: image.etag,
					requesttoken: oc_requesttoken
				};
				var downloadUrl = Gallery.utility.buildGalleryUrl('files',
					'/download/' + image.fileId,
					params);

				return {
					name: name,
					path: image.path,
					file: image.fileId,
					mimeType: image.mimeType,
					url: previewUrl,
					downloadUrl: downloadUrl
				};
			});
			Gallery.activeSlideShow.setImages(images, autoPlay);
			Gallery.activeSlideShow.onStop = function () {
				$('#content').show();
				Gallery.view.removeLoading();
				if (Gallery.currentAlbum !== '') {
					// Only modern browsers can manipulate history
					if (history && history.replaceState) {
						history.replaceState('', '',
							'#' + encodeURIComponent(Gallery.currentAlbum));
					} else {
						location.hash = '#' + encodeURIComponent(Gallery.currentAlbum);
					}
				} else {
					// Only modern browsers can manipulate history
					if (history && history.replaceState) {
						history.replaceState('', '', '#');
					} else {
						location.hash = '#';
					}
				}
			};
			Gallery.activeSlideShow.show(start);
			if(!_.isUndefined(Gallery.Share)){
				Gallery.Share.hideDropDown();
			}
			$('.album-info-container').slideUp();
			// Resets the last focused element
			document.activeElement.blur();
		},

		/**
		 * Moves files and albums to a new location
		 *
		 * @param {jQuery} $item
		 * @param {string} fileName
		 * @param {string} filePath
		 * @param {jQuery} $target
		 * @param {string} targetPath
		 */
		move: function ($item, fileName, filePath, $target, targetPath) {
			var self = this;
			var dir = Gallery.currentAlbum;

			if (targetPath.charAt(targetPath.length - 1) !== '/') {
				// make sure we move the files into the target dir,
				// not overwrite it
				targetPath = targetPath + '/';
			}
			self.filesClient.move(dir + '/' + fileName, targetPath + fileName)
				.done(function () {
					self._removeElement(dir, filePath, $item);
				})
				.fail(function (status) {
					if (status === 412) {
						// TODO: some day here we should invoke the conflict dialog
						OC.Notification.showTemporary(
							t('gallery', 'Could not move "{file}", target exists', {file: fileName})
						);
					} else {
						OC.Notification.showTemporary(
							t('gallery', 'Could not move "{file}"', {file: fileName})
						);
					}
					$item.fadeTo("normal", 1);
					$target.children('.album-loader').hide();
				})
				.always(function () {
					// Nothing?
				});
		},

		/**
		 * Builds the album's model
		 *
		 * @param {{
		 * 	files:Array,
		 * 	albums:Array,
		 * 	albumconfig:Object,
		 * 	albumpath:String,
		 *	updated:Boolean
		 * 	}} data
		 * @private
		 */
		_mapFiles: function (data) {
			Gallery.imageMap = {};
			var image = null;
			var path = null;
			var fileId = null;
			var mimeType = null;
			var mTime = null;
			var etag = null;
			var size = null;
			var sharedWithUser = null;
			var owner = null;
			var currentLocation = data.albumpath;
			// This adds a new node to the map for each parent album
			Gallery._mapStructure(currentLocation);
			var files = data.files;
			if (files.length > 0) {
				var subAlbumCache = {};
				var albumCache = Gallery.albumMap[currentLocation]
					= new Album(
					currentLocation,
					[],
					[],
					OC.basename(currentLocation),
					data.albums[currentLocation].nodeid,
					data.albums[currentLocation].mtime,
					data.albums[currentLocation].etag,
					data.albums[currentLocation].size,
					data.albums[currentLocation].sharedwithuser,
					data.albums[currentLocation].owner,
					data.albums[currentLocation].freespace,
					data.albums[currentLocation].permissions
				);
				for (var i = 0; i < files.length; i++) {
					path = files[i].path;
					fileId = files[i].nodeid;
					mimeType = files[i].mimetype;
					mTime = files[i].mtime;
					etag = files[i].etag;
					size = files[i].size;
					sharedWithUser = files[i].sharedwithuser;
					owner = files[i].owner;

					image =
						new GalleryImage(
							path, path, fileId, mimeType, mTime, etag, size, sharedWithUser
						);

					// Determines the folder name for the image
					var dir = OC.dirname(path);
					if (dir === path) {
						dir = '';
					}
					if (dir === currentLocation) {
						// The image belongs to the current album, so we can add it directly
						albumCache.images.push(image);
					} else {
						// The image belongs to a sub-album, so we create a sub-album cache if it
						// doesn't exist and add images to it
						if (!subAlbumCache[dir]) {
							subAlbumCache[dir] = new Album(
								dir,
								[],
								[],
								OC.basename(dir),
								data.albums[dir].nodeid,
								data.albums[dir].mtime,
								data.albums[dir].etag,
								data.albums[dir].size,
								data.albums[dir].sharedwithuser,
								data.albums[currentLocation].owner,
								data.albums[currentLocation].freespace,
								data.albums[dir].permissions);
						}
						subAlbumCache[dir].images.push(image);
						// The sub-album also has to be added to the global map
						if (!Gallery.albumMap[dir]) {
							Gallery.albumMap[dir] = {};
						}
					}
					Gallery.imageMap[image.path] = image;
				}
				// Adds the sub-albums to the current album
				Gallery._mapAlbums(albumCache, subAlbumCache);

				// Caches the information which is not already cached
				albumCache.etag = data.albums[currentLocation].etag;
				albumCache.imageMap = Gallery.imageMap;
			}
		},

		/**
		 * Adds every album leading to the current folder to a global album map
		 *
		 * Per example, if you have Root/Folder1/Folder2/CurrentFolder then the map will contain:
		 *    * Root
		 *    * Folder1
		 *    * Folder2
		 *    * CurrentFolder
		 *
		 *  Every time a new location is loaded, the map is completed
		 *
		 *
		 * @param {string} path
		 *
		 * @returns {Album}
		 * @private
		 */
		_mapStructure: function (path) {
			if (!Gallery.albumMap[path]) {
				Gallery.albumMap[path] = {};
				// Builds relationships between albums
				if (path !== '') {
					var parent = OC.dirname(path);
					if (parent === path) {
						parent = '';
					}
					Gallery._mapStructure(parent);
				}
			}
			return Gallery.albumMap[path];
		},

		/**
		 * Adds the sub-albums to the current album
		 *
		 * @param {Album} albumCache
		 * @param {{Album}} subAlbumCache
		 * @private
		 */
		_mapAlbums: function (albumCache, subAlbumCache) {
			for (var j = 0, keys = Object.keys(subAlbumCache); j <
			keys.length; j++) {
				albumCache.subAlbums.push(subAlbumCache[keys[j]]);
			}
		},

		/**
		 * Saves the folder to a remote ownCloud installation
		 *
		 * Our location is the remote for the other server
		 *
		 * @param {string} remote
		 * @param {string}token
		 * @param {string}owner
		 * @param {string}name
		 * @param {boolean} isProtected
		 * @private
		 */
		_saveToOwnCloud: function (remote, token, owner, name, isProtected) {
			var location = window.location.protocol + '//' + window.location.host + OC.webroot;
			var isProtectedInt = (isProtected) ? 1 : 0;
			var url = remote + '/index.php/apps/files#' + 'remote=' + encodeURIComponent(location)
				+ "&token=" + encodeURIComponent(token) + "&owner=" + encodeURIComponent(owner) +
				"&name=" +
				encodeURIComponent(name) + "&protected=" + isProtectedInt;

			if (remote.indexOf('://') > 0) {
				OC.redirect(url);
			} else {
				// if no protocol is specified, we automatically detect it by testing https and
				// http
				// this check needs to happen on the server due to the Content Security Policy
				// directive
				$.get(OC.generateUrl('apps/files_sharing/testremote'),
					{remote: remote}).then(function (protocol) {
					if (protocol !== 'http' && protocol !== 'https') {
						OC.dialogs.alert(t('files_sharing',
							'No ownCloud installation (7 or higher) found at {remote}',
							{remote: remote}),
							t('files_sharing', 'Invalid ownCloud url'));
					} else {
						OC.redirect(protocol + '://' + url);
					}
				});
			}
		},

		/**
		 * Removes the moved element from the UI and refreshes the view
		 *
		 * @param {string} dir
		 * @param {string}filePath
		 * @param {jQuery} $item
		 * @private
		 */
		_removeElement: function (dir, filePath, $item) {
			var images = Gallery.albumMap[Gallery.currentAlbum].images;
			var albums = Gallery.albumMap[Gallery.currentAlbum].subAlbums;
			// if still viewing the same directory
			if (Gallery.currentAlbum === dir) {
				var removed = false;
				// We try to see if an image was removed
				var movedImage = _(images).findIndex({path: filePath});
				if (movedImage >= 0) {
					images.splice(movedImage, 1);
					removed = true;
				} else {
					// It wasn't an image, so try to remove an album
					var movedAlbum = _(albums).findIndex({path: filePath});
					if (movedAlbum >= 0) {
						albums.splice(movedAlbum, 1);
						removed = true;
					}
				}

				if (removed) {
					$item.remove();
					// Refresh the photowall without checking if new files have arrived in the
					// current album
					// TODO On the next visit this album is going to be reloaded, unless we can get
					// an etag back from the move endpoint
					Gallery.view.init(Gallery.currentAlbum);
				}
			}
		}
	};
	window.Gallery = Gallery;
})(jQuery, OC, t);
