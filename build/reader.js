var EPUBJSR = EPUBJSR || {};

EPUBJSR.app = {};

EPUBJSR.app.init = (function($){
  "use strict";
  var Book,
  	  offline = false,
  	  sidebarWidth = 0,
  	  windowWidth;

  function init(bookURL){
	var search = window.location.search.match(/book=(.*)/),
		bookURL = bookURL || (search ? search[1] : "moby-dick");

	//-- Setup the browser prefixes 
	// EPUBJS.core.crossBrowserColumnCss();

	//-- Set up our sidebar
	windowWidth = $(window).width();
	if(windowWidth > 550){
		$("#main").width(windowWidth-sidebarWidth);
	}else{
		$("#main").width(windowWidth);
	}
	
	//-- Create a new book object, 
	//	 this will create an iframe in the el with the ID provided
	Book = new EPUBJS.Book({ bookPath: bookURL, restore : true });
	
	
	//Book.single = true;
	
	//-- Add listeners to handle book events
	//-- Full list of event are at start of book.js
	
	
	// Book.listen("book:metadataReady", meta);
	// Book.listen("book:tocReady", toc);
	// Book.listen("book:bookReady", bookReady);
	// Book.listen("book:chapterReady", chapterChange);
	Book.on("book:online", goOnline);
	Book.on("book:offline", goOffline);
	
	Book.getMetadata().then(meta);
	Book.getToc().then(toc);
		
	Book.ready.all.then(bookReady);
	
	Book.renderTo("area");

	
	
	//Book.registerHook("beforeChapterDisplay", EPUBJS.Hooks.transculsions.insert);
	
	//-- Start loading / parsing of the book.
	//	 This must be done AFTER adding listeners or hooks
	//Book.renderTo("area");
	
	//-- Wait for Dom ready to handle jquery
	$(function() {
		controls();
	});

	return Book;

  }

  function meta(meta){
	  var title = meta.bookTitle,//Book.getTitle(),
		  author = meta.creator, //Book.getCreator(),
		  $title = $("#book-title"),
		  $author = $("#chapter-title"),
		  $dash = $("#title-seperator");

	  document.title = title+" – "+author;
	  $title.html(title);
	  $author.html(author);
	  $dash.show();

  }

  function toc(contents){
	  var $toc = $("#toc"),
		  $links,
		  $items;

  	  $toc.empty();
  	  //-- Recursively generate TOC levels
  	  $items = generateTocItems(contents, 1);
	 
		
	  $toc.append($items);
	  
	  $links = $(".toc_link");
	  
	  $links.on("click", function(e){
	  	var $this = $(this),
	  		url = $this.data("url");
	  	

	 	$(".openChapter").removeClass("openChapter");
	  	$this.parents('li').addClass("openChapter");	

	  	
	  	//-- Provide the Book with the url to show
	  	//	 The Url must be found in the books manifest

		Book.goto(url);
		e.preventDefault();
	  	

	  });

   }

  function loadSettings() {

  	var userFont = "";

  	if (!localStorage.getItem("fontSize")) {
  	 	userFont = "medium";
  		localStorage.setItem("fontSize", userFont);
  	} else {
  		userFont = localStorage.getItem("fontSize");
  	}

  	var $settings = $("#settingsPanel");
  	$settings.append("<ul></ul>");

  	var $settingsItem = $("<li><h3></h3></li>");
		
  	var $fontSizes = $("<input type='radio' name='fontSize' value='x-small'><span class='xsmall'>Extra Small</span><br>" +
  				"<input type='radio' name='fontSize' value='small'><span class='small'>Small</span><br>" +
  				"<input type='radio' name='fontSize' value='medium'><span class='medium'>Medium</span><br>" +
  				"<input type='radio' name='fontSize' value='large'><span class='large'>Large</span><br>" +
  				"<input type='radio' name='fontSize' value='x-large'><span class='xlarge'>Extra Large</span>");

  	$settingsItem.find("h3").text('Font Size').after($fontSizes);
	$settings.find("ul").append($settingsItem);

	var $fontSizeButtons = $('input[name="fontSize"]');

	$fontSizeButtons.each(function() {

		if ($(this).attr("value") == userFont) {
			$(this).attr("checked", "checked");
		}

		$(this).on("click", function() {
			localStorage.setItem("fontSize", $(this).attr("value"));
			//reload the page after selecting a new font
			Book.iframe.contentDocument.location.reload(true);

		});
	});
	//Single or double column
  	/*
  	var userLayout = "";
  	if (!localStorage.getItem("layout")) {
  	 	userLayout = "medium";
  		localStorage.setItem("layout", userLayout);
  	} else {
  		userLayout = localStorage.getItem("layout");
  	}

  	var $settings = $("#settingsPanel");
  	$settings.append("<ul></ul>");

  	var $settingsItem = $("<li><h3></h3></li>");
		
  	var $layout = $("<input type='radio' name='layout' value='singleColumn'><span class=''>Single Column</span><br>" +
  				"<input type='radio' name='layout' value='doubleColumn'><span class=''>Double Column</span><br>");

  	$settingsItem.find("h3").text('Font Size').after($layout);
	$settings.find("ul").append($settingsItem);

	var $layoutButtons = $('input[name="layout"]');

	$layoutButtons.each(function() {

		if ($(this).attr("value") == userLayout) {
			$(this).attr("checked", "checked");
		}

		$(this).on("click", function() {
			localStorage.setItem("layout", $(this).attr("value"));
			//reload the page after selecting a new font
			Book.iframe.contentDocument.location.reload(true);

		});
	});

  	//LineSpacing
  	var userLineSpacing = "";
  	//Contrast
  	var userContrast = "";
  	//Font Type
  	var userFontType = "";
	*/
  }


  
  function generateTocItems(contents, level){
	  var $container = $("<ul>");
	  var type = (level == 1) ? "chapter" : "section";

	  contents.forEach(function(item){
		  	var $subitems,
		  		$wrapper = $("<li id='toc-"+item.id+"'>"),
				$item = $("<a class='toc_link " + type + "' href='#/"+item.href+"' data-url='"+item.href+"'>"+item.label+"</a>");

			$wrapper.append($item);
			if(item.subitems && item.subitems.length){
				level++;
				$subitems = generateTocItems(item.subitems, level);
				$wrapper.append($subitems);
			}
			
			$container.append($wrapper);
	  });
	  return $container;
  }
	
   function bookReady(){
	  var $divider = $("#divider"),
		  $loader = $("#loader");
	  
	  $loader.hide();
	  
	  if(!Book.single) {
	  	$divider.addClass("show");
	  }
	  
  }
  
  function goOnline(){
  	  var $icon = $("#store");
  	  offline = false;
  	  $icon.attr("src", $icon.data("save"));
  
  }
  
  function goOffline(){
  	  var $icon = $("#store");
  	  offline = true;
  	  $icon.attr("src", $icon.data("saved"));
  
  }
  
  function chapterChange(e) {
	  var id = e.msg,
	  	  $item = $("#toc-"+id),
	  	  $current = $(".currentChapter");
	  	  
	  if($item.length){
		  $current.removeClass("currentChapter");
		  $item.addClass("currentChapter");
	  }	  
	  
  }

  function controls(){
	  var $next = $("#next"),
	  	  $prev = $("#prev"),
	  	  $main = $("#main"),
	  	  $book = $("#area"),
	  	  $sidebar = $("#sidebar"),
	  	  $open = $("#open"),
	  	  $icon = $open.find("img"),
	  	  $network = $("#network"),
	  	  $settingLink = $("#setting"),
	  	  $settings = $("#settingsPanel"),
	  	  $toc = $("#toc"),
	  	  $fullscreen = $("#fullscreen"),
	  	  $fullscreenicon = $("#fullscreenicon"),
          $cancelfullscreenicon = $("#cancelfullscreenicon"),
	  	  $window = $(window);


	  $window.on("resize", function(){
		  windowWidth = $(window).width();
		  if(windowWidth > 550){
		  	$main.width(windowWidth-sidebarWidth);
		  }else{
		  	$main.width(windowWidth);
		  }
	  });

	  $next.on("click", function(){
	  	Book.nextPage();
	  });

	  $prev.on("click", function(){
	  	Book.prevPage();
	  });

	  $settingLink.on("click", function() {
	  	if (!$settings.is(":visible")) {
	  		showSettings();
	  	} else {
	  		hideSettings();
	  	}

	  });
	 
	  $fullscreen.on("click", function () {
        screenfull.toggle($('#container')[0]);
        $fullscreenicon.toggle();
        $cancelfullscreenicon.toggle();
      });

	  var lock = false;
	   	$(document).keydown(function(e){
	  	 	if(lock) return;

	   		if (e.keyCode == 37) { 
	  	 	   $prev.trigger("click");

	  	 	   lock = true;
	  	 	   setTimeout(function(){
	  		 	   lock = false;
	  	 	   }, 100);
	   		   return false;
	   		}
	   		if (e.keyCode == 39) { 
	   		   $next.trigger("click");
	   		   lock = true;
	   		   setTimeout(function(){
	   		   	lock = false;
	   		   }, 100);

	   		   return false;
	   		}
	   	});
		
		function showSidebar(){
			//$book.css("pointer-events", "none"); //-- Avoid capture by ifrmae
			$sidebar.addClass("open");
			$main.addClass("closed");
			$icon.attr("src", $icon.data("close"));
		}
		
		function hideSidebar(){
			$book.css("pointer-events", "visible");
			$sidebar.removeClass("open");
			$main.removeClass("closed");
			$icon.attr("src",$icon.data("open"));
		}
		
		function showSettings(){
			$toc.hide();
	  		$settings.show();
		}

		function hideSettings(){
			$settings.hide();
			$toc.show();
		}
		
	   	$open.on("click", function(){
		   if($sidebar.hasClass("open")){
			   hideSidebar();
		   }else{
			   showSidebar();
			   
			   // $open.clickOutside(function(){
			   //   hideSidebar();
			   // });
		   }
	   	});
	   		
	   	   	
	   	$network.on("click", function(){
		   offline = !offline;
	   	   Book.fromStorage(offline);
	   	});

		
  }
  	
  return  init;

})(jQuery);
EPUBJS.reader = {};

EPUBJS.Reader = function(path, options) {
	var reader = this;
	var book = this.book = ePub(path, options);
	
	this.offline = false;
	this.sidebarOpen = false;
	
	book.renderTo("viewer");

	book.ready.all.then(function() {
		reader.ReaderView = EPUBJS.reader.ReaderView.call(reader, book);
		reader.SettingsView = EPUBJS.reader.SettingsView.call(reader, book);
		reader.ControlsView = EPUBJS.reader.ControlsView.call(reader, book);
		
	});

	book.getMetadata().then(function(meta) {
		reader.MetaView = EPUBJS.reader.MetaView.call(reader, meta);
	});

	book.getToc().then(function(toc) {
		reader.TocView = EPUBJS.reader.TocView.call(reader, toc);
	});
	
	return this;
};

EPUBJS.reader.MetaView = function(meta) {
	var title = meta.bookTitle,
			author = meta.creator;

	var $title = $("#book-title"),
			$author = $("#chapter-title"),
			$dash = $("#title-seperator");

		document.title = title+" – "+author;

		$title.html(title);
		$author.html(author);
		$dash.show();
};

EPUBJS.reader.ReaderView = function(book) {
	var $main = $("#main"),
			$divider = $("#divider"),
			$loader = $("#loader"),
			$next = $("#next"),
			$prev = $("#prev");
	
	var slideIn = function() {
		$main.removeClass("closed");
	};
	
	var slideOut = function() {
		$main.addClass("closed");
	};
	
	var showLoader = function() {
		$loader.show();
	};
	
	var hideLoader = function() {
		$loader.hide();
	};
	
	var showDivider = function() {
		$divider.addClass("show");
	};
	
	var hideDivider = function() {
		$divider.removeClass("show");
	};
	
	var keylock = false;
	
	var arrowKeys = function(e) {		
		if(e.keyCode == 37) { 
			book.prevPage();
			$prev.addClass("active");

			keylock = true;
			setTimeout(function(){
				keylock = false;
				$prev.removeClass("active");
			}, 100);

			 e.preventDefault();
		}
		if(e.keyCode == 39) { 
			book.nextPage();
			$next.addClass("active");
			
			keylock = true;
			setTimeout(function(){
				keylock = false;
				$next.removeClass("active");
			}, 100);
			
			 e.preventDefault();
		}
	}

	document.addEventListener('keydown', arrowKeys, false);
	
	$next.on("click", function(e){
		book.nextPage();
		e.preventDefault();
	});
	
	$prev.on("click", function(e){
		book.prevPage();
		e.preventDefault();
	});
	
	//-- Hide the spinning loader
	hideLoader();
	
	//-- If the book is using spreads, show the divider
	if(!book.single) {
		showDivider();
	}
	
	return {
		"slideOut" : slideOut,
		"slideIn"  : slideIn,
		"showLoader" : showLoader,
		"hideLoader" : hideLoader,
		"showDivider" : showDivider,
		"hideDivider" : hideDivider
	};
};

EPUBJS.reader.ControlsView = function(book) {
	var reader = this;

	var $store = $("#store"),
			$fullscreen = $("#fullscreen"),
			$fullscreenicon = $("#fullscreenicon"),
			$cancelfullscreenicon = $("#cancelfullscreenicon"),
			$slider = $("#slider"),
			$main = $("#main"),
			$sidebar = $("#sidebar"),
			$settings = $("#settings"),
			$bookmark = $("#bookmark");
			
	
	var goOnline = function() {
		reader.offline = false;
		// $store.attr("src", $icon.data("save"));
	};

	var goOffline = function() {
		reader.offline = true;
		// $store.attr("src", $icon.data("saved"));
	};
	
	var showSidebar = function() {
		reader.sidebarOpen = true;
		reader.ReaderView.slideOut();
		$sidebar.addClass("open");
	}
	
	var hideSidebar = function() {
		reader.sidebarOpen = false;
		reader.ReaderView.slideIn();
		$sidebar.removeClass("open");
	}
	
	book.on("book:online", goOnline);
	book.on("book:offline", goOffline);

	$slider.on("click", function () {
		if(reader.sidebarOpen) {
			hideSidebar();
		} else {
			showSidebar();
		}
	});
	
	$fullscreen.on("click", function() {
		screenfull.toggle($('#container')[0]);
		$fullscreenicon.toggle();
		$cancelfullscreenicon.toggle();
	});
	
	$settings.on("click", function() {
		reader.TocView.hide();
		reader.SettingsView.show();
	});

	$bookmark.on("click", function() {
		console.log(reader.book.getCurrentLocationCfi());
	});
	
	return {
		"fadeIn" : fadeIn,
		"fadeOut": fadeOut
	};
};

EPUBJS.reader.TocView = function(toc) {
	var book = this.book;
	
	var $list = $("#toc"),
			docfrag = document.createDocumentFragment();
	
	var generateTocItems = function(toc, level) {
		var container = document.createElement("ul");
		
		if(!level) level = 1;

		toc.forEach(function(chapter) {
			var listitem = document.createElement("li"),
					link = document.createElement("a");
			var subitems;
			
			listitem.id = "toc-"+chapter.id;

			link.textContent = chapter.label;
			link.href = chapter.href;
			link.classList.add('toc_link');
			
			
			if(chapter.subitems) {
				level++;
				subitems = generateTocItems(chapter.subitems, level);
				listitem.appendChild(subitems);
			}
			
			listitem.appendChild(link);
			container.appendChild(listitem);
			
		});
		
		return container;
	};
	
	var onShow = function() {
		$list.show();
	};
	
	var onHide = function() {
		$list.hide();
	};

	var tocitems = generateTocItems(toc);
	
	docfrag.appendChild(tocitems);
	
	$list.append(docfrag);
	
	$list.find("a").on("click", function(event){
			var url = this.getAttribute('href');

			//-- Provide the Book with the url to show
			//   The Url must be found in the books manifest
			book.goto(url);

			event.preventDefault();
	});
	
	return {
		"show" : onShow,
		"hide" : onHide
	};
};

EPUBJS.reader.SettingsView = function(toc) {
	var book = this.book;

	var $settings = $("#settingsPanel");

	var onShow = function() {
		$settings.show();
	};

	var onHide = function() {
		$settings.hide();
	};

	return {
		"show" : onShow,
		"hide" : onHide
	};
};
EPUBJSR.search = {};

// Search Server -- https://github.com/futurepress/epubjs-search
EPUBJSR.search.SERVER = "http://localhost:5000";

EPUBJSR.search.request = function(q, callback) {
  var fetch = $.ajax({
    dataType: "json",
    url: EPUBJSR.search.SERVER + "/search?q=" + encodeURIComponent(q) 
  });

  fetch.fail(function(err) {
    console.error(err);
  });

  fetch.done(function(results) {
    callback(results);
  });
};

EPUBJSR.search.View = function(Book) {

  var $searchBox = $("#searchBox"),
      $searchResults = $("#searchResults"),
      $tocView = $("#toc"),
      $searchView = $("#searchView"),
      iframeDoc;
  
  
  $searchBox.on("search", function(e) {
    var q = $searchBox.val();

    e.preventDefault();
    //-- SearchBox is empty or cleared
    if(q == '') {
      $searchResults.empty();
      $searchView.removeClass("shown");
      $tocView.removeClass("hidden");
      $(iframeDoc).find('body').unhighlight();
      iframeDoc = false;
      return;
    }

    if(!$searchView.hasClass("shown")) {
      $searchView.addClass("shown");
      $tocView.addClass("hidden");
    }
    
    $searchResults.empty();
    $searchResults.append("<li><p>Searching...</p></li>");
    
    
    
    EPUBJSR.search.request(q, function(data) {
      var results = data.results;
      
      $searchResults.empty();
      
      if(iframeDoc) { 
        $(iframeDoc).find('body').unhighlight();
      }
      
      if(results.length == 0) {
        $searchResults.append("<li><p>No Results Found</p></li>");
        return;
      }
      
      iframeDoc = $("#area iframe")[0].contentDocument;
      $(iframeDoc).find('body').highlight(q, { element: 'span' });
      
      results.forEach(function(result) {
        var $li = $("<li></li>");
        var $item = $("<a href='"+result.href+"' data-cfi='"+result.cfi+"'><span>"+result.title+"</span><p>"+result.highlight+"</p></a>");

        $item.on("click", function(e) {
          var $this = $(this),
              cfi = $this.data("cfi");
          
          e.preventDefault();
          
          Book.gotoCfi(cfi);
          
          Book.on("renderer:chapterDisplayed", function() {
            iframeDoc = $("#area iframe")[0].contentDocument;
            $(iframeDoc).find('body').highlight(q, { element: 'span' });
          })
          
          
          
        });
        $li.append($item);
        $searchResults.append($li);
      });

    });

  });

};

//-- http://stackoverflow.com/questions/2124684/jquery-how-click-anywhere-outside-of-the-div-the-div-fades-out

jQuery.fn.extend({
  // Calls the handler function if the user has clicked outside the object (and not on any of the exceptions)
  clickOutside: function(handler, exceptions) {
	  var $this = this;

	  jQuery(document).on("click.offer", function(event) {
		  if (exceptions && jQuery.inArray(event.target, exceptions) > -1) {
			  return;
		  } else if (jQuery.contains($this[0], event.target)) {
			  return;
		  } else {
			  jQuery(document).off("click.offer");
			  handler(event, $this);
		  }
	  });

	  return this;
  }
});
