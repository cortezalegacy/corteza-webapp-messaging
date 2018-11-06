#SCSS includes references and infos

most of the classes are close to the ones of bootstrap way of defining things.
some useless elements on unused styling options are unimplemented, ask for extras to be added ;)

## Alerts / Notifications

.notification and .alert are alias classes, one can be used or the other irregardless.

Class references for alerts and notifications are from <https://getbootstrap.com/docs/4.1/components/alerts/>

Not all colors / styles have added or are deemed necessary for now.

Alert styles can be chosen via colors : `alert-green`, `alert-red`, ...\
Available colors are : `grey` (default), `green`, `yellow`, `red`, `blue`, `teal`.\
Colored notifications use the same "info icon".

Or by type : `notification-info`, `alert-info`, `notification-error`, ...\
Available types are : info, error/danger, success, warning. \
For notifications you can also add the qualifier without prefix.
So `class="notification-info"` is the same as `class="notification info"`.

All notifications/alerts comme with an external margin of 10px. \
Use no-margin class to remove :)

#### Sample usages

### All those variations should produce the same result (the last two having different icons)
```
<div class="alert error">
    <p>
      <strong>OH SNAP !</strong>
      Change a few things up ands try submitting again.
    </p>
    <span class="close"></span>
</div>

<div class="alert-error">
    <p><strong>HEADS UP !</strong> This alert needs your attention, it's super important.</p>
    <span class="close"></span>
</div>

<div class="notification-error">
    <p><strong>HEADS UP !</strong> This alert needs your attention, it's super important.</p>
    <span class="close"></span>
</div>

<div class="notification error">
    <p><strong>HEADS UP !</strong> This alert needs your attention, it's super important.</p>
    <span class="close"></span>
</div>

<div class="notification red">
    <p><strong>HEADS UP !</strong> This alert needs your attention, it's super important.</p>
    <span class="close"></span>
</div>

<div class="alert red">
    <p><strong>HEADS UP !</strong> This alert needs your attention, it's super important.</p>
    <span class="close"></span>
</div>
```
### different other styles, none of them red
```
<div class="notification">
    <p><strong>WELL DONE !</strong> You successfully read this important alert message.</p>
    <span class="close"></span>
</div>

<div class="notification info">
    <p><strong>WELL DONE !</strong> You successfully read this important alert message.</p>
    <span class="close"></span>
</div>

<div class="notification-teal">
    <p><strong>WELL DONE !</strong> You successfully read this important alert message.</p>
    <span class="close"></span>
</div>

<div class="notification warning">
    <p><strong>OH SNAP !</strong> Change a few things up ands try submitting again.</p>
    <span class="close"></span>
</div>

<div class="alert-info">
    <p><strong>OH SNAP !</strong> Change a few things up ands try submitting again.</p>
    <span class="close"></span>
</div>
```

## Form elements / inputs
Class references for inputs are from <https://getbootstrap.com/docs/4.1/components/forms/>

### checkables.scss : Radio and checkcboxes + toggle !

Basic usage : form-check class \
**NB:** `for="<input id>"` is required in label
```
<div class="form-check">
  <input
    type="radio"
    id="radio-id">
  <label for="radio-id">
      Radio label text
  </label>
</div>
<div class="form-check">
  <input
    type="checkbox"
    id="checkbox-id">
  <label for="checkbox-id">
      Checkbox label text
  </label>
</div>
```
Radios and checkboxes can be styled to look like toggles using form-toggle instead of form-check.
```
<div class="form-toggle">
  <input
    type="checkbox"
    id="checkbox-id">
  <label for="checkbox-id">
      Toggle label text
  </label>
</div>
```

## Icons
Icons are outputted via a font file generated with IcoMoon.\
https://icomoon.io/app/

A list of the ones currently available is here : \
https://crust.polux.studio/crust-icomoon/demo.html

The icomoon generated files are in the git repo : \
https://git.polux.studio/Polux/open_crust \
folder crust-icomoon

To add icons to the library, go to :
https://icomoon.io/app/#/projects
Use the "import project" to upload the project reference file :
selection.json
Then go to "load" on the generated project

This should display all the icons currently in the library.
Icons can be added either from SVG files (using "import icons" button) or by choosing icons from the librairies available (the button just right of "import icons").

Currently icons that are not custom either comme from the "feather" library or from the "icomoon free" library : \
https://feathericons.com/ \
https://icomoon.io/#preview-free

Once new icons have been added use the "generate font" button, this will build a zip with all the necessary files for an update of the icons.

The zip has the folowwing structure :
* [dir] demo-files
* [dir] fonts
* demo.html
* dir.txt
* Read Me.txt
* selection.json
* style.css
* style.scss
* variables.scss

The only elements that interest us here are the fonts directory, style.scss and variables.scss.\
The fonts directory is copied as is to src/assets/fonts\
The content of variables and style **excluding the first 2 lines of each file** are copied in src/sass/_0.fonts.icons.scss just below : \
```//paste the rest of icomoon here```

From then on icons can be put on any tag using the appropriate icon-*`<iconname>`* class. Usually it is used with an empty `<i>` tag like so : \
```<i class="icon-smile"></i>```

The insert is done via a :before but all icons are also referenced via scss variables, so you can do the include somewhere else if needed using, for instance :
```
.my-bit-with-icon{
  &:before
  {
    content:$icon-smile;
    font-family: '#{$icomoon-font-family}';
  }
}
```
