#SCSS includes references and infos

most of the classes are close to the ones of bootstrap way of defining things.
some useless elements on unused styling options are unimplemented, ask for extras to be added ;)

Class references for inputs are from <https://getbootstrap.com/docs/4.1/components/forms/>

## Form elements / inputs

### checkables.scss
### Radio and checkcboxes + toggle !

Basic usage : form-check class
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
