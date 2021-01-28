import {Modifier, ContentState, EditorState, RichUtils, convertFromHTML, createContentState} from "draft-js";

/*
The editor i am currently building is for speed and efficiency. Content is organised as blocks --- there are three levels of content. Highest level is header-two, 2nd is header-three... and unstyled text/unordered list item are treated as the same.
All bold has to be convered into header-two... All underlines are converted into header-three
This function implements that styling
*/
function DefaultHandleStyles(block, pastedContentState)  {
  let pastedEditorState = EditorState.createWithContent(pastedContentState)

  const type = block.getType();
  const text = block.getText();

  let bold = false;
  let underline = false;

  block.findStyleRanges((value)=>{
    if (value.hasStyle('BOLD'))
      return true;
    return false;
    },(start, end)=>{
      if(text.length==(end-start))
        bold = true;
    }
  )

  block.findStyleRanges((value)=>{
    if (value.hasStyle('UNDERLINE'))
      return true;
    return false;
    },(start, end)=>{
      if(text.length==(end-start))
        underline = true;
    }
  )

  if (['unordered-list-item','ordered-list-item'].indexOf(type)!=-1)
    pastedEditorState = RichUtils.toggleBlockType(pastedEditorState, 'unordered-list-item')

  if ((["header-four","header-five","header-six"].indexOf(type)!=-1)||underline)
    pastedEditorState = RichUtils.toggleBlockType(pastedEditorState, 'header-three');

  //if an item was bold and underlined --- it would be converted into bold equivalent only
  if ((["header-one","header-two", "header-three",].indexOf(type)!=-1)||bold)
    pastedEditorState = RichUtils.toggleBlockType(pastedEditorState, 'header-two');

  return pastedEditorState

}


//get tags from text
function DefaultHandleEntities(text) {
  let pastedContentState = ContentState.createFromText(text)

  //words starting with #
  const tagRe = /(\s#[^#\s]+)|(^#[^#\s]+)/g
  var m;
  let matches = [];

  do {
      m = tagRe.exec(text);

      if (m)  {
        var start = m.index;
        //remember 'tagRe' gives us the matches including the \s before the tag. Adjusting for such matches
        if (m[0].length>m[0].trim().length)
          start+=1;

        matches.push({text:m[0].trim(), start:start, end:start+m[0].trim().length})
      }

  } while (m);

  matches.forEach((tag)=>{
    const contentStateWithEntity = pastedContentState.createEntity('TAG', 'IMMUTABLE', {tag:tag.text.substring(1)});

    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const selectionState = contentStateWithEntity.getSelectionAfter();
    const newSelectionState = selectionState.merge({'anchorOffset':tag.start, 'focusOffset':tag.end});

    pastedContentState = Modifier.applyEntity(contentStateWithEntity, newSelectionState, entityKey)
  })

  return pastedContentState

}

const HandlePastedText = (pastedText, html, editorState, onChange, HandleEntities=null, HandleStyles=null) =>  {

  if (html || pastedText) {
    var blocks;

    //convert from html to text blocks by using draft-js functions or create a block if its plain text
    if (html) {
      const htmlContentState = convertFromHTML(html);
      blocks = htmlContentState.contentBlocks.slice();
    }
    else {
      blocks = ContentState.createFromText(pastedText).getBlocksAsArray();
    }

    let transformedBlocks = []

    for (var i=0; i<blocks.length; i++) {
      const block = blocks[i];
      const text = block.getText();

      //entities are added based on text and regex --- and converted into a contentState
      const pastedContentState = (HandleEntities)?HandleEntities(text):DefaultHandleEntities(text)

      //contentstate is converted to an editor state to add styling --- styling needs selectionState too - so, needed to convert to editorState
      const pastedEditorState = (HandleStyles)?HandleStyles(block, pastedContentState):DefaultHandleStyles(block, pastedContentState);

      //convert the entity'ed and styled editorState to a block --- to add to a list of blocks
      transformedBlocks = transformedBlocks.concat(pastedEditorState.getCurrentContent().getBlocksAsArray())
    }

    const transformedContentState = ContentState.createFromBlockArray(transformedBlocks);
    const currentContentState = editorState.getCurrentContent()
    const selectionState = editorState.getSelection()

    const pushContentState = Modifier.replaceWithFragment(currentContentState, selectionState, transformedContentState.getBlockMap())

    const newEditorState = EditorState.push(editorState, pushContentState, 'insert-fragment');

    onChange(newEditorState);

    return true;
  }


  return false;
}

export default HandlePastedText;
