import streamlit as st
import os

st.set_page_config(
    page_title="Giải Pickleball Ban Kỹ Thuật - Vietnam Airlines",
    page_icon="🏓",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Hide Streamlit default elements for full-screen app
st.markdown("""
<style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .stApp > header {display: none;}
    .block-container {padding: 0 !important; max-width: 100% !important;}
    iframe {border: none;}
</style>
""", unsafe_allow_html=True)

def load_app():
    """Load the HTML app with all CSS and JS inlined."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Read CSS files
    css_files = ['variables.css', 'base.css', 'components.css', 'layout.css', 'animations.css']
    css_content = ''
    for f in css_files:
        path = os.path.join(base_dir, 'css', f)
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as fh:
                css_content += fh.read() + '\n'
    
    # Read JS files
    js_files = ['store.js', 'helpers.js', 'players.js', 'teams.js', 'bracket.js', 'scoring.js', 'standings.js', 'app.js']
    js_content = ''
    for f in js_files:
        path = os.path.join(base_dir, 'js', f)
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as fh:
                js_content += fh.read() + '\n'
    
    # Read HTML and inject CSS/JS
    html_path = os.path.join(base_dir, 'index.html')
    with open(html_path, 'r', encoding='utf-8') as fh:
        html = fh.read()
    
    # Replace CSS link tags with inline styles
    css_links = ''
    for f in css_files:
        css_links_pattern = f'<link rel="stylesheet" href="css/{f}">'
        html = html.replace(css_links_pattern, '')
    
    # Replace JS script tags with inline scripts
    for f in js_files:
        js_script_pattern = f'<script src="js/{f}"></script>'
        html = html.replace(js_script_pattern, '')
    
    # Inject inline CSS before </head>
    html = html.replace('</head>', f'<style>{css_content}</style>\n</head>')
    
    # Inject inline JS before </body>
    html = html.replace('</body>', f'<script>{js_content}</script>\n</body>')
    
    return html

html_content = load_app()
st.components.v1.html(html_content, height=900, scrolling=True)
