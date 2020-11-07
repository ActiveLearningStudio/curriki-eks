var H5P = H5P || {};

H5P.ImmersiveReader = (function ($) {
    /**
     * Constructor function.
     */
    function C(options, id) {
        // Extend defaults with provided options
        this.options = $.extend(true, {}, {
            title: 'Default title',
            immersivecontent: 'Default content'
        }, options);
        // Keep provided id.
        this.id = id;
    }

    C.prototype.launchImmersiveReader = function () {
        console.log('launching immersve reader...');

        axios.get('https://studio.curriki.org/api/immersive')
            .then((response) => {
                console.log(response);
                var token = response.data.access_token;
                var subdomain = 'curriki';
                const data = {
                    title: this.options.title,
                    chunks: [{
                        // content: $.parseHTML(this.options.immersivecontent)[0].textContent,
                        content: this.options.immersivecontent,
                        mimeType: "text/html"
                    }]
                };

                ImmersiveReader.launchAsync(token, subdomain, data);
            });
    }

    /**
     * Attach function called by H5P framework to insert H5P content into
     * page
     *
     * @param {jQuery} $container
     */
    C.prototype.attach = function ($container) {
        console.log('H5P: Rendering immersive reader content type');
        console.log($.parseHTML(this.options.immersivecontent));
        $container.addClass("h5p-immersive");

        $container.append('<h1 class="immersive-title">' + this.options.title + '</h1>');
        $container.append('<div class="immersive-controls"><button class="immersive-launch-button">Launch Immersive Reader</button></div>')
        $container.append('<div class="immersive-content">' + decodeEntities(this.options.immersivecontent) + '</div>');

        $('.immersive-controls button').on('click', () => {
            this.launchImmersiveReader();
        });

        setTimeout(iframesCheck, 3000);
    };

    /**
     * Loop through each IFrame
     */
    function iframesCheck() {
        var iframes = $('.files iframe');
        iframes.each(function (index, ele) {
            // console.log(ele);
            checkIframeLoaded(ele);
        });
    }

    /**
     * Check if iframe re-loaded skip, otherwise re-load it
     * @param ele
     */
    function checkIframeLoaded(ele) {
        var count = 0;
        var intervalID = setInterval(function () {
            if (!isIframeLoaded(ele) && count < 3) {
                var element = $(ele);
                var iframe_url = element.attr("src")
                element.attr("src", iframe_url);
                count++;
                console.log("IFrame ReLoaded...");
                return;
            }
            clearInterval(intervalID);
        }, 1500);
    }

    /**
     * Quick hack to verify the content of IFrame is Loaded Or NOt
     * Function for checking specific iframe content is loaded or not
     * @param ele
     * @returns {boolean}
     */
    function isIframeLoaded(ele) {
        try {
            console.log(ele.contentWindow); // if iframe is loaded this will through exception due to cross-origin policy
            return false; // if here means exception is not thrown so content is not loaded in iframe
        } catch (err) {
            return true;
        }
    }

    /**
     * Decode string HTML Entities
     * @param encodedString
     * @returns {string}
     */
    function decodeEntities(encodedString) {
        var textArea = document.createElement('textarea');
        textArea.innerHTML = encodedString;
        return textArea.value;
    }

    return C;
})(H5P.jQuery);
