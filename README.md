# Super-Dkf

Application complète de gestion avec backend Django et frontend React.

## Structure du projet

- `my_store/` - Backend Django REST API
- `react-app/` - Frontend React
- `carton-central-main/` - Application frontend alternative (TypeScript/Vite)

## Prérequis

- Python 3.14+
- Node.js et npm
- PostgreSQL (optionnel, SQLite par défaut)

## Installation

### Backend Django

```bash
cd my_store
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend React

```bash
cd react-app
npm install
npm start
```

## Technologies utilisées

- **Backend**: Django, Django REST Framework
- **Frontend**: React, Tailwind CSS
- **Base de données**: SQLite (développement) / PostgreSQL (production)

## Fonctionnalités

- Gestion des clients
- Gestion des produits
- Gestion des commandes
- Gestion des ventes
- Gestion des factures
- Gestion des dépenses

