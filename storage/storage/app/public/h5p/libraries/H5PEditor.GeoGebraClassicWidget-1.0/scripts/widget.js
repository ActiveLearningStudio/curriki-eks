var H5PEditor = H5PEditor || {};
/**
 * Applet Editor widget module
 *
 * @param {H5P.jQuery} $
 */
H5PEditor.widgets.GeoGebraClassicWidget = H5PEditor.GeoGebraClassicWidget = (function ($) {

    var ggbApp = [];

    /**
     * Creates color selector.
     *
     * @class H5PEditor.GeoGebraClassicWidget
     *
     * @param {Object} parent
     * @param {Object} field
     * @param {string} params
     * @param {H5PEditor.SetParameters} setValue
     */
    function C(parent, field, params, setValue) {
        this.parent = parent;
        this.field = field;
        this.params = params;
        this.setValue = setValue;
        var that = this;

        parent.ready(function () {
            ggbApp.inject('ggb-element');
            setInterval(function () {
                that.setWidget(ggbApplet.getBase64());
            }, 1000);
        });

    }

    /**
     * Append the field to the wrapper.
     *
     * @param {H5P.jQuery} $wrapper
     */
    C.prototype.appendTo = function ($wrapper) {
        var self = this;

        self.$container = $('<div>', {
            'class': 'field text h5p-classic-applet'
        });

        // Add header:
        $('<span>', {
            'class': 'h5peditor-label',
            html: self.field.label
        }).appendTo(self.$container);

        // Add description:
        $('<span>', {
            'class': 'h5peditor-field-description',
            'id': 'ggb-element',
            html: self.field.description
        }).appendTo(self.$container);

        self.$container.appendTo($wrapper);
        self.initializeGeoGabra();
    };

    /**
     * Create GeoGebra Applet
     */
    C.prototype.initializeGeoGabra = function () {
        let appName = 'appName';
        let appValue = 'classic';
        let base64Val = this.params;

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
    }

    /**
     * Set widget base64 encoded value
     * @param val
     */
    C.prototype.setWidget = function (val) {
        this.params = val;
        // console.log("Widget Value set...");
        this.setValue(this.field, this.params);
    };

    /**
     * Validate the current values.
     *
     * @returns {boolean}
     */
    C.prototype.validate = function () {
    };

    /**
     * Remove the current field
     */
    C.prototype.remove = function () {
    };

    return C;
})(H5P.jQuery);