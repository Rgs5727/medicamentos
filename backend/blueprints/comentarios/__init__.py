from flask import Blueprint

comentarios_bp = Blueprint("comentarios", __name__)

from . import routes