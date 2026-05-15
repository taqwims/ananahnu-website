import re

with open('temp_docx/word/document.xml', 'r') as f:
    content = f.read()

# We find blocks of Pihak Pertama and Pihak Kedua
# Each block ends with Nama:
# There are 2 blocks for Pihak Pertama and 2 for Pihak Kedua

# Find all occurrences of Nama:</w:t>
matches = list(re.finditer(r'Nama:</w:t>', content))
print(f"Found {len(matches)} matches for Nama:</w:t>")

# If we found 4, we assume first 2 are Pihak Pertama, last 2 are Pihak Kedua
if len(matches) == 4:
    # Split the content and rebuild
    new_content = content[:matches[0].start()] + 'Nama: [Nama Penandatangan]</w:t>'
    new_content += content[matches[0].end():matches[1].start()] + 'Nama: [Nama Penandatangan]</w:t>'
    new_content += content[matches[1].end():matches[2].start()] + 'Nama: [Nama Klien / Perusahaan]</w:t>'
    new_content += content[matches[2].end():matches[3].start()] + 'Nama: [Nama Klien / Perusahaan]</w:t>'
    new_content += content[matches[3].end():]
    
    with open('temp_docx/word/document.xml', 'w') as f:
        f.write(new_content)
    print("Successfully updated document.xml with footer placeholders.")
else:
    print("Did not find expected 4 matches, skipping automatic placeholder insertion.")
