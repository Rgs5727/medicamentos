from flask import Flask, redirect, url_for, session
from blueprints.remedies import remedies_bp
from dotenv import load_dotenv
import os 

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY") or "socorro"

@app.context_processor
def inject_user():
    return {
        "usuario_logado": session.get("usuario_email"),
        "usuario_nome": session.get("usuario_nome")
    }

app.register_blueprint(remedies_bp)

@app.route("/")
def index():
    return redirect(url_for("remedies.listar_remedios"))


if __name__ == "__main__":
    app.run(debug=True)
