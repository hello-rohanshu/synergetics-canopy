---
draft: "true"
---

# Superscript table

| Number | Subscript | Superscript |
| ------ | --------- | ----------- |
| Zero   | ₀         | ⁰           |
| One    | ₁         | ¹           |
| Two    | ₂         | ²           |
| Three  | ₃         | ³           |
| Four   | ₄         | ⁴           |
| Five   | ₅         | ⁵           |
| Six    | ₆         | ⁶           |
| Seven  | ₇         | ⁷           |
| Eight  | ₈         | ⁸           |
| Nine   | ₉         | ⁹           |
| n      | ₙ         | ⁿ           |

# Symbols

```
π
—
→
```

# Snippets to go with Dev Tools


### Highlight italics:
```
	$$('i, em, .italic, [style*="font-style: italic"]').forEach(el => el.style.backgroundColor = 'yellow'); 
```


### Highlight numbers and '=' signs
```

(function highlightNumbersAndEquals() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    
    while (walker.nextNode()) {
        const parentTag = walker.currentNode.parentElement.tagName;
        if (parentTag !== 'SCRIPT' && parentTag !== 'STYLE' && parentTag !== 'TEXTAREA') {
            nodes.push(walker.currentNode);
        }
    }

    nodes.forEach(node => {
        const parent = node.parentNode;
        if (!parent) return;

        const text = node.nodeValue;
        // Updated Regex: Matches digits (\d+) OR the equal sign (=)
        const targetRegex = /(\d+|=)/g;

        if (targetRegex.test(text)) {
            const span = document.createElement('span');
            span.innerHTML = text.replace(targetRegex, 
                '<span style="background-color: red !important; color: white !important; font-weight: bold !important; padding: 0 2px; border-radius: 2px;">$1</span>'
            );
            parent.replaceChild(span, node);
        }
    });
})();
```


### Highlight superscripts

```
(function() {
  const superscripts = document.querySelectorAll('sup');
  
  superscripts.forEach(el => {
    el.style.backgroundColor = 'yellow';
    el.style.border = '1px solid red';
    el.style.borderRadius = '2px';
    el.style.padding = '1px';
  });

  console.log(`Highlighted ${superscripts.length} total superscripts.`);
})();
```


# Highlight superscripts, subscripts and equal signs

(Em dash underscores are of grey color, for a visual separation from relevant superscripts)

```
(function() {
  // 🎨 High-contrast, easily distinguishable colors
  const COLORS = {
    superscript: {
      backgroundColor: '#FFD700',  // gold
      border: '2px solid #FF0000'  // red
    },
    subscript: {
      backgroundColor: '#00FFFF',  // cyan
      border: '2px solid #0000FF'  // blue
    },
    equals: {
      backgroundColor: '#FF69B4',  // hot pink
      border: '2px solid #8B008B'  // dark magenta
    }
  };
  
  const borderRadius = '2px';
  const padding = '1px 2px';
  
  const superscripts = document.querySelectorAll('sup');
  const subscripts = document.querySelectorAll('sub');
  const equalsSigns = [];
  
  // Find all text nodes containing equals signs
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        return node.textContent.includes('=') 
          ? NodeFilter.FILTER_ACCEPT 
          : NodeFilter.FILTER_REJECT;
      }
    }
  );
  
  while (walker.nextNode()) {
    equalsSigns.push(walker.currentNode);
  }
  
  // Apply styles to superscripts
  superscripts.forEach(el => {
    el.style.backgroundColor = COLORS.superscript.backgroundColor;
    el.style.border = COLORS.superscript.border;
    el.style.borderRadius = borderRadius;
    el.style.padding = padding;
  });
  
  // Apply styles to subscripts
  subscripts.forEach(el => {
    el.style.backgroundColor = COLORS.subscript.backgroundColor;
    el.style.border = COLORS.subscript.border;
    el.style.borderRadius = borderRadius;
    el.style.padding = padding;
  });
  
  // Highlight equals signs
  equalsSigns.forEach(textNode => {
    const parent = textNode.parentNode;
    const text = textNode.textContent;
    const highlightedHTML = text.replace(
      /=/g, 
      `<span style="background-color: ${COLORS.equals.backgroundColor}; border: ${COLORS.equals.border}; border-radius: ${borderRadius}; padding: ${padding};">=</span>`
    );
    
    if (highlightedHTML !== text) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = highlightedHTML;
      
      while (tempDiv.firstChild) {
        parent.insertBefore(tempDiv.firstChild, textNode);
      }
      parent.removeChild(textNode);
    }
  });
  
  console.log(`Highlighted ${superscripts.length} superscripts, ${subscripts.length} subscripts, and ${equalsSigns.length} text nodes containing equals signs.`);
})();
```

# Changes to be made/Rules to be followed
(with regards to linking)
06-06-2026

- Links which are linking to images and tables present in the same para should not be clickable to avoid confusion.
- Links linking to figures and attachments directly should instead link to where the figure is used in the text.
- "Section xyz" should be linked in whole and not just the number 'xyz'. But any suffixing description should be avoided
- special: (as we have seen in Sections [[640.00 Tension and Compression#644.00 Limitless Ratios of Tension|644 through 646.03]]).
- special: (see Sec. [[920.00 Functions of A and B Modules|920]] through 940).

Specifics
- 1010.00: Should "drawings sections" be a link?
- "displaystyle" in latex is rendered with no difference in Obsidian but is bigger in Quartz than without it. Unsure if to use it or not. Given it is distinct, it should be searchable across the repo if change is needed later. DeepSeek said use it as it's the ideal display size.
- (See [[pp. 46-47]].) in 220.00 is what?


# More
- asterisk to be scanned across the repo, and if there is any space before and after it, it should be removed. otherwise parser can fail to recognize asterisk pairs, failing to render or leaking italics beyond the end.
	- unsure if space on left or right should be removed as one side will have letters and other side space as the word ends