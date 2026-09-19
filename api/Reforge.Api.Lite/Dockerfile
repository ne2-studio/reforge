FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["Reforge.Api.Lite/Reforge.Api.Lite.csproj", "Reforge.Api.Lite/"]
COPY ["Reforge.Core/Reforge.Core.csproj", "Reforge.Core/"]
COPY ["Reforge.Infra.Common/Reforge.Infra.Common.csproj", "Reforge.Infra.Common/"]
COPY ["Reforge.Infra.Lite/Reforge.Infra.Lite.csproj", "Reforge.Infra.Lite/"]
COPY ["Reforge.Api.Common/Reforge.Api.Common.csproj", "Reforge.Api.Common/"]
RUN dotnet restore "Reforge.Api.Lite/Reforge.Api.Lite.csproj"

# Copy the rest of the code
COPY . .

# Build and publish
RUN dotnet publish "Reforge.Api.Lite/Reforge.Api.Lite.csproj" -c Release -o /app/publish

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine
WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "Reforge.Api.Lite.dll"]
