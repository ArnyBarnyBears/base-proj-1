from flask import Flask, render_template, send_from_directory

app = Flask(__name__)

# Serve the main page
@app.route('/')
def index():
    return render_template('index.html')

# Serve the ABI file
@app.route('/static/message.txt')
def serve_abi():
    return send_from_directory('static', 'message.txt')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)

