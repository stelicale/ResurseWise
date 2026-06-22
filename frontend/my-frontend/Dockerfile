# Build aplicatiei React folosind Node.js
FROM node:20-alpine AS build
WORKDIR /app
# Build-time env for CRA (injected into bundle)
ARG REACT_APP_KEYCLOAK_URL
ARG REACT_APP_KEYCLOAK_REALM
ARG REACT_APP_KEYCLOAK_CLIENT_ID
ARG REACT_APP_KEYCLOAK_PROXY_PREFIX
ENV REACT_APP_KEYCLOAK_URL=$REACT_APP_KEYCLOAK_URL \
	REACT_APP_KEYCLOAK_REALM=$REACT_APP_KEYCLOAK_REALM \
	REACT_APP_KEYCLOAK_CLIENT_ID=$REACT_APP_KEYCLOAK_CLIENT_ID \
	REACT_APP_KEYCLOAK_PROXY_PREFIX=$REACT_APP_KEYCLOAK_PROXY_PREFIX
# Copiaza dependentele pentru a le cache-ui si apoi le instaleaza
COPY package*.json ./
RUN npm install
COPY . .
# Compileaza productia in /app/build
RUN npm run build

# Build-ul static cu Nginx
FROM nginx:alpine
# Copiaza fisierele build-uite in root-ul Nginx
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
# Ruleaza Nginx in foreground 
CMD ["nginx", "-g", "daemon off;"]
