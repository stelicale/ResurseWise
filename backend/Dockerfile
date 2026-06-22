# Build folosind Maven
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copiaza pom.xml si descarca dependentele pentru a le cache-ui
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Compileaza fara a rula testele
COPY src ./src
RUN mvn clean package -DskipTests -B

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

ENV SERVER_PORT=8080 \
	JAVA_OPTS=""

# Creaza un utilizator non-root pentru a rula aplicatia
# Compileaza JAR-ul din etapa de build
RUN addgroup -S spring && adduser -S spring -G spring
COPY --from=build /app/target/*.jar app.jar
RUN chown spring:spring /app/app.jar

# Ruleaza aplicatia
USER spring
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=$SERVER_PORT -jar app.jar"]
