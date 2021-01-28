# HandlePastedText

Function to handle pasted text in draft-js. This seems to be one of the key features of draftail. I didn't want the other features/heavy customization of draftail. 

If your requirements are basic like changing a few styles or creating tags/entities out of pasted text, it should work out of the box. You can provide your custom function for styling or entity creation for advanced uses.

#Installation
npm install handlepastedtext --save

#ES6 import
import HandlePastedText from 'handlepastedtext'

#Requirements
Needs draft-js

#Typical usage
<Editor
    ...
    handlePastedText={(pastedText, html, edSt)=>HandlePastedText(pastedText, html, edSt, this.onChange)}
    ...
/>

this.onChange is the function that usually handles change in editorState. HandlePastedText calls that function with the newEditorState
