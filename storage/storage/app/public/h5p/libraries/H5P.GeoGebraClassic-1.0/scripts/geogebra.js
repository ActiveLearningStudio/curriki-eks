var H5P = H5P || {};

H5P.GeoGebraClassic = (function ($, UI) {
    /**
     * Constructor function.
     */
    function C(options, id) {
        // Extend defaults with provided options
        this.options = $.extend(true, {}, {
            geogebra_title: 'GeoGebra Classic Library',
        }, options);
        // Keep provided id.
        this.id = id;
        this.registerDOMElements();
    };

    /**
     * Attach function called by H5P framework to insert H5P content into
     * page
     *
     * @param {jQuery} $container
     */
    C.prototype.attach = function ($container) {
        // Set ID on container to identify it as a ggb element
        // container.  Allows for styling later.
        this.$container = $container

        // appends the applet area to main container
        this.$ggbArea.appendTo(this.$container);

        // appends the all other containers to master container of library
        /* this.$saveButton.appendTo(this.$buttonContainer);
         this.$buttonContainer.appendTo(this.$libraryArea);*/ //save button is not needed for now - might be needed in future release
        this.$libraryArea.appendTo(this.$container);
        this.initializeGeoGabra();
    }

    /**
     * Create GeoGebra Applet
     */
    C.prototype.initializeGeoGabra = function () {
        let ggbApp = [];
        let appName = 'appName';
        let appValue = 'classic';
        let base64Val = this.options.geogebra_applet;

        if (base64Val) {
            appName = 'ggbBase64';
            appValue = base64Val;
        }
        ggbApp = new GGBApplet({
            [appName]: appValue,
            "width": 800,
            "height": 600,
            "showToolBar": true,
            "showAlgebraInput": true,
            "showMenuBar": false
        }, true);

        window.addEventListener("load", function () {
            ggbApp.inject('ggb-element');
        });
    }

    /**
     * registerDOMElements.
     */
    C.prototype.registerDOMElements = function () {
        const that = this;
        this.$libraryArea = $('<div />', {
            class: 'h5p-library-area'
        });

        this.$ggbArea = $('<div />', {
            id: 'ggb-element'
        });

        this.$saveButton = this.createButton('save', 'save', ' Save', that.saveActivity);

        this.$buttonContainer = $('<div class="button-container" />');
    };

    /**
     * createButton - creating all buttons used in this game.
     * @param {string} name Buttonname - TITLe.
     * @param {string} icon Fa icon name.
     * @param {string} param Button text parameter.
     * @param {function} callback Callback function.
     * @return {H5P.JoubelUI.Button} Joubel ui button object.
     */
    C.prototype.createButton = function (name, icon, param, callback) {
        const cFunction = callback.bind(this);
        return UI.createButton({
            title: name,
            click: cFunction,
            html: '<span><i class="fa fa-' + icon + '" aria-hidden="true"></i></span>' + param
        });
    };

    /**
     * saveActivity - Save the modified data of the activity.
     */
    C.prototype.saveActivity = function () {
        // this.$saveButton.detach();
        alert('Current state of activity is fetch from API and logged on Console.');
        console.log(ggbApplet.getBase64());
    };
    return C;
})
(H5P.jQuery, H5P.JoubelUI);
