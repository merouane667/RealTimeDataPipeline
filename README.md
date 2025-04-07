🚀 Pipeline de Données en Temps Réel avec Kafka, Redis et WebSockets
![image](https://github.com/user-attachments/assets/91a8461d-1178-4caa-82a7-10cbb9527801)

1. 📘 Introduction
🎯 Objectif du projet : Création d’un pipeline de données en temps réel qui collecte, traite et affiche des informations d’employés.
❓ Problématique : Comment gérer efficacement la transmission de données entre différents services avec une performance optimale et un affichage en temps réel ?

2. 🏗️ Architecture Globale
🔧 Services Principaux
🗃️ MySQL : Base de données source contenant les informations des employés

📨 Kafka : Système de messagerie pour la transmission de données en temps réel

⚡ Redis : Cache pour optimiser les performances des requêtes

💻 Frontend : Interface utilisateur en temps réel via WebSockets

🔄 Flux de Données
📥 Extraction des données depuis MySQL

🧠 Mise en cache dans Redis

📤 Publication dans Kafka

📡 Consommation et transmission au serveur web

🌐 Diffusion en temps réel vers le frontend via WebSockets

3. 🧩 Composants Techniques
3.1 📝 Publisher
📦 Extraction des données depuis MySQL

🧰 Mise en cache des résultats dans Redis

📣 Publication dans Kafka avec intervalles configurables

⚙️ Optimisation des performances grâce au cache

3.2 🛸 Message Broker (Kafka)
🔄 Gestion des flux de données en temps réel

🛡️ Haute disponibilité et résilience

📊 Capacité à gérer de grands volumes de données

3.3 📬 Consumer
🔍 Consommation des messages depuis Kafka

🧭 Transmission des données au serveur web

🧹 Traitement des messages et gestion des erreurs

3.4 🌍 Serveur Web & Frontend
🧠 Serveur Express avec Socket.IO

⚡ Interface utilisateur réactive en temps réel

📊 Tableau de bord avec mises à jour dynamiques

🗂️ Journal d’activité pour suivre les changements

