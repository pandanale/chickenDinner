from flask import Flask

def create_app():
    """Create and configure the app."""
    app = Flask(__name__)
    app.config['DATABASE'] = "Scrappy.db"
    # app.secret_key = "your_secret_key"

    # Register blueprints
    from my_app.routes import app as app_blueprint
    app.register_blueprint(app_blueprint)

    return app
