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



# Changes to be made/Rules to be followed
(with regards to linking)
06-06-2026

- Links which are linking to images and tables present in the same para should not be clickable to avoid confusion.
- Links linking to figures and attachments directly should instead link to where the figure is used in the text.
- "Section xyz" should be linked in whole and not just the number 'xyz'. But any suffixing description should be avoided
- Range should be linked as a whole. 

Specifics
- 1010.00: Should "drawings sections" be a link?

Questions
- For a link range, Obsidian renders only the given heading. If Quartz does that in the future, the parent header might need linking. 