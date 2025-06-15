# Diagram Builder

This Diagram Builder is forked from [DgrmJS](https://github.com/AlexeyBoiko/DgrmJS) and extends its functionality with several new features and improvements.

## New Features

### New Components

#### Image Upload
- Images under 100KB are embedded into JSON (base64 encoded)
- Images over 100KB require upload to a cloud server (login required)
- Supports various image formats (e.g., PNG, JPG, GIF)

#### Rectangle Group
- Draw empty rectangles to group elements
- Helps in organizing and structuring your diagrams

### Undo/Redo Functionality
- Implement undo and redo operations for all actions
- Enhances user experience by allowing easy correction of mistakes

### Layer Management
- Move elements up or down in the canvas
- Resolve overlapping issues by adjusting element layers
- Ensures accessibility to all elements, even when overlapped

### Metadata Management
- Export diagram metadata for backup or sharing
- Import metadata to recreate diagrams
- Supports collaboration and version control

### Delete Keyboard Support
- Delete shapes by press delete key 
- Shift key pressed makes the line will be straight

### Customizable Styles
- Apply custom styles to diagram elements
- Customize colors, line styles, and fonts

### URL Parameters

#### Initialization Options
1. JSON: Load diagram from a JSON file
   `type=json&http://your-json-file.json`
2. Image: Load an image file as the diagram background
   `type=file&http://your-image-file.png`
3. Drupal Integration: Load diagram data from a Drupal server using UUID
   `type=drupal&uuid=xxx`
4. New init option for scale
   `type=drupal&uuid=xxx&scale=0.5`

#### Examples

```bash
# scale
http://localhost:3001/index.dev.html?scale=0.5

# loading by json
http://localhost:3001/index.dev.html?type=json&file=/test-diagram.json

# loanding by json and scale
http://localhost:3001/index.dev.html?type=json&file=/test-diagram.json&scale=1.5

# Loading from drupal by uuid
http://localhost:3001/index.dev.html?type=drupal&uuid=your-uuid&scale=2.0
```

PS: scale, ` 0.1 - 4.0 (10% - 400%)

## Online demo
Please check this url [AI Flowchart Maker](https://vizchart.com) to use the apps for free, but for AI features, which is limited per day. 

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE.md) file for details.

