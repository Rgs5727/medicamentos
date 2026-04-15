from flask import Blueprint

remedies_bp = Blueprint("remedies", __name__)

from . import routes