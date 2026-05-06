FROM eclipse-temurin:17-jdk AS builder
WORKDIR /app

# Ensure mvnw has execute permissions
COPY mvnw ./
COPY .mvn .mvn
RUN chmod +x ./mvnw

COPY pom.xml ./
RUN ./mvnw dependency:go-offline

COPY src ./src
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
