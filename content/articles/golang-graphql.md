---
title: Golang GraphQL Server
description: I briefly discuss a GraphQL server written in GO that allows for both OAuth2 and general registration access.
img: joao-tzanno-G9_Euqxpu4k-unsplash.jpg
alt: Golang GraphQL Server
featured: 0
author: 
    name: Jesse Quinn
    bio: All about Jesse
    img: https://images.unsplash.com/photo-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80
    alt: profile photo
publishedAt: 2019-12-26T03:00:00.000Z
updateAt: 2020-07-19T03:00:00.000Z
---

Before I get started the project can be found on [github](https://github.com/jessequinn/go-gql-server). However, this project is based on an amazing article that can be found  on [dev](https://dev.to/cmelgarejo/creating-an-opinionated-graphql-server-with-go-part-1-3g3l).

I have dockerized this project but is not required for functionality. Finally, access to an auth provider like google or auth0 is required. But, you are not limited to those as we will be using [goth](https://github.com/markbates/goth) which supports quite a number of providers.

The following will be the structure of the app

```
.
├── build
│   └── gql-server
├── cmd
│   └── gql-server
│       └── main.go
├── docker
│   ├── app
│   │   └── dev.Dockerfile
│   └── mysql
│       └── my.cnf
├── docker-compose.yml
├── go.mod
├── go.sum
├── gqlgen.yml
├── internal
│   ├── gql
│   │   ├── generated.go
│   │   ├── models
│   │   │   └── generated.go
│   │   ├── resolvers
│   │   │   ├── generated
│   │   │   │   └── resolver.go
│   │   │   ├── main.go
│   │   │   ├── transformations
│   │   │   │   ├── users.go
│   │   │   │   └── users_test.go
│   │   │   └── users.go
│   │   └── schemas
│   │       └── schema.graphql
│   ├── handlers
│   │   ├── auth
│   │   │   ├── handlers.go
│   │   │   ├── main.go
│   │   │   └── middleware
│   │   │       ├── auth.go
│   │   │       └── main.go
│   │   ├── gql.go
│   │   └── ping.go
│   ├── logger
│   │   └── main.go
│   └── orm
│       ├── main.go
│       ├── migration
│       │   ├── jobs
│       │   │   ├── seed_rbac.go
│       │   │   └── seed_users.go
│       │   └── main.go
│       └── models
│           ├── base.go
│           ├── rbac.go
│           └── user.go
├── pkg
│   ├── server
│   │   ├── init.go
│   │   ├── main.go
│   │   ├── router.go
│   │   └── routes
│   │       ├── auth.go
│   │       ├── graphql.go
│   │       └── misc.go
│   └── utils
│       ├── consts
│       │   └── main.go
│       ├── context-keys.go
│       ├── env.go
│       └── types.go
└── scripts
    ├── build.sh
    ├── dev-run.sh
    ├── gqlgen.sh
    └── run.sh
```

I believe it will be much easier to speak about each folder and/or subfolder individually to break down code and to better understand the logic.

As the heart of this server is to provide GraphQL I will first explain the folder `internal\gql`. This folder is based on the package [gqlgen](https://gqlgen.com/) and requires a `gqlgen.yml` in the root directory.

The file contains the following

```
# go-gql-server gqlgen.yml file
# Refer to https://gqlgen.com/config/
# for detailed .gqlgen.yml documentation.

# Pick up all the schema files you put in this directory
schema:
    - 'internal/gql/schemas/**/*.graphql'
# Let gqlgen know where to put the generated server
exec:
    filename: internal/gql/generated.go
    package: gql
# Let gqlgen know where to put the generated models (if any)
model:
    filename: internal/gql/models/generated.go
    package: models
# Let gqlgen know where to put the generated resolvers
resolver:
    filename: internal/gql/resolvers/generated/resolver.go
    type: Resolver
    package: resolvers
autobind: []
```

According to the documentation for `gqlgen` the following command `go run github.com/99designs/gqlgen init` would produce several important files

* gqlgen.yml — The gqlgen config file, knobs for controlling the generated code.
* generated.go — The GraphQL execution runtime, the bulk of the generated code.
* models_gen.go — Generated models required to build the graph. Often you will override these with your own models. Still very useful for input types.
* resolver.go — This is where your application code lives. generated.go will call into this to get the data the user has requested.
* server/server.go — This is a minimal entry point that sets up an http.Handler to the generated GraphQL server.

But we have configured a `gqlgen.yml` to place these files in specific folders with specific package names. So in fact we really only need to run `go run github.com/99designs/gqlgen` from the root directory. `server.go` will not be produced as we do not need this. The entire point of this project is to create this server. For further information on `gqlgen.yml` you can read the [documentation](https://gqlgen.com/config/).

We could also, for simplicity, incorporate the `gqlgen` command into a bash script and place it in the `scripts` folder as `gqlgen.sh`

```
#!/bin/bash
printf "\nRegenerating gqlgen files\n"
# Optional, delete the resolver to regenerate, only if there are new queries
# or mutations, if you are just chageing the input or type definition and
# doesn't impact the resolvers definitions, no need to do it
while [[ "$#" -gt 0 ]]; do case $1 in
  -r|--resolvers)
    rm -f internal/gql/resolvers/generated/resolver.go
  ;;
  *) echo "Unknown parameter passed: $1"; exit 1;;
esac; shift; done

time go run -v github.com/99designs/gqlgen
printf "\nDone.\n\n"
```

Anyhow, let's get back to the `gql` folder. We will need to define the schema of our `GraphQL` server by using a `schema.graphql` file that describes our API using the [GraphQL Schema Definition Language](https://graphql.org/learn/schema/) that is placed in the folder `internal/gql/schemas`. For instance, we could use the following for users 

**important note** 

As defined by our `gqlgen.yml` we do not need to use `schema` as the filename and to be better organized, especially with a larger project, I believe we should name the schema more appropriately such as `users_schema.graphql`.

```
scalar Time
# Types
type User {
    id: ID!
    email: String!
    avatarURL: String
    name: String
    firstName: String
    lastName: String
    nickName: String
    description: String
    location: String
    APIkey: String
    profiles: [UserProfile]
    createdAt: Time
    updatedAt: Time
}

type UserProfile {
    id: ID!
    email: String!
    avatarURL: String
    name: String
    firstName: String
    lastName: String
    nickName: String
    description: String
    location: String
    APIkey: String
    profiles: [UserProfile]
    createdAt: Time!
    updatedAt: Time
}

# Input Types
input UserInput {
    email: String
    password: String
    avatarURL: String
    displayName: String
    name: String
    firstName: String
    lastName: String
    nickName: String
    description: String
    location: String
}

# List Types
type Users {
    count: Int
    list: [User!]!
}

# Define mutations here
type Mutation {
    createUser(input: UserInput!): User!
    updateUser(id: ID!, input: UserInput!): User!
    deleteUser(id: ID!): Boolean!
}

# Define queries here
type Query {
    users(id: ID): Users!
}
```

I believe the `schema` is self-explanatory, but you can always leave a comment, and I will respond. Just remember though, any modifications or additional schemas, you will need to rerun the `gqlgen.sh` script.

Now let's get into the application code found under `internal/gql/resolvers`. Here we have two files namely `main.go` and `users.go`.

The `main.go` contains the following which includes a `Resolver struct` that passes a database connection and we also define two functions that expose both the `mutation` and `query` types.

```
package resolvers

import (
	"github.com/jessequinn/go-gql-server/internal/gql"
	"github.com/jessequinn/go-gql-server/internal/orm"
)

// Resolver is a modifiable struct that can be used to pass on properties used
// in the resolvers, such as DB access
type Resolver struct {
	ORM *orm.ORM
}

// Mutation exposes mutation methods
func (r *Resolver) Mutation() gql.MutationResolver {
	return &mutationResolver{r}
}

// Query exposes query methods
func (r *Resolver) Query() gql.QueryResolver {
	return &queryResolver{r}
}

type mutationResolver struct{ *Resolver }

type queryResolver struct{ *Resolver }
```

The more specific `users.go` contains all fields expressed in the `schema` such as `CreateUser`, `UpdateUser`, `DeleteUser`, etc. You'll also notice some key imports namely `log` which in fact uses a wrapper for `logrus`, which will be discussed soon and finally `tf`, which is needed as we are using a `db` so we need a way to `transform` the data to `gorm` and vice-versa. Yes, this project requires [gorm](https://gorm.io/).

```
package resolvers

import (
	"context"

	log "github.com/jessequinn/go-gql-server/internal/logger"

	"github.com/jessequinn/go-gql-server/internal/gql/models"
	tf "github.com/jessequinn/go-gql-server/internal/gql/resolvers/transformations"
	dbm "github.com/jessequinn/go-gql-server/internal/orm/models"
)

// CreateUser creates a record
func (r *mutationResolver) CreateUser(ctx context.Context, input models.UserInput) (*models.User, error) {
	return userCreateUpdate(r, input, false)
}

// UpdateUser updates a record
func (r *mutationResolver) UpdateUser(ctx context.Context, id string, input models.UserInput) (*models.User, error) {
	return userCreateUpdate(r, input, true, id)
}

// DeleteUser deletes a record
func (r *mutationResolver) DeleteUser(ctx context.Context, id string) (bool, error) {
	return userDelete(r, id)
}

// Users lists records
func (r *queryResolver) Users(ctx context.Context, id *string) (*models.Users, error) {
	return userList(r, id)
}

// ## Helper functions
func userCreateUpdate(r *mutationResolver, input models.UserInput, update bool, ids ...string) (*models.User, error) {
	dbo, err := tf.GQLInputUserToDBUser(&input, update, ids...)
	if err != nil {
		return nil, err
	}
	// Create scoped clean db interface
	db := r.ORM.DB.New().Begin()
	if !update {
		db = db.Create(dbo).First(dbo) // Create the user
	} else {
		db = db.Model(&dbo).Update(dbo).First(dbo) // Or update it
	}
	gql, err := tf.DBUserToGQLUser(dbo)
	if err != nil {
		db.RollbackUnlessCommitted()
		return nil, err
	}
	db = db.Commit()
	return gql, db.Error
}

func userDelete(r *mutationResolver, id string) (bool, error) {
	return false, nil
}

func userList(r *queryResolver, id *string) (*models.Users, error) {
	entity := "users"
	whereID := "id = ?"
	record := &models.Users{}
	dbRecords := []*dbm.User{}
	db := r.ORM.DB.New()
	if id != nil {
		db = db.Where(whereID, *id)
	}
	db = db.Find(&dbRecords).Count(&record.Count)
	for _, dbRec := range dbRecords {
		if rec, err := tf.DBUserToGQLUser(dbRec); err != nil {
			log.Errorfn(entity, err)
		} else {
			record.List = append(record.List, rec)
		}
	}
	return record, db.Error
}
```

The `transformations` that we import, as mentioned above, provides a way to `transform` the `input type` to `gorm` and vice-versa. For instance, `transformations/users.go` contains several functions to do this

```go
package transformations

import (
	"errors"

	"github.com/markbates/goth"

	"github.com/gofrs/uuid"
	gql "github.com/jessequinn/go-gql-server/internal/gql/models"
	dbm "github.com/jessequinn/go-gql-server/internal/orm/models"
)

// DBUserToGQLUser transforms [user] db input to gql type
func DBUserToGQLUser(i *dbm.User) (o *gql.User, err error) {
	o = &gql.User{
		AvatarURL:   i.AvatarURL,
		ID:          i.ID.String(),
		Email:       i.Email,
		Name:        i.Name,
		FirstName:   i.FirstName,
		LastName:    i.LastName,
		NickName:    i.NickName,
		Description: i.Description,
		Location:    i.Location,
		CreatedAt:   i.CreatedAt,
		UpdatedAt:   i.UpdatedAt,
	}
	return o, err
}

// GQLInputUserToDBUser transforms [user] gql input to db model
func GQLInputUserToDBUser(i *gql.UserInput, update bool, ids ...string) (o *dbm.User, err error) {
	o = &dbm.User{
		Name:        i.Name,
		FirstName:   i.FirstName,
		LastName:    i.LastName,
		NickName:    i.NickName,
		Description: i.Description,
		Location:    i.Location,
	}
	if i.Email == nil && !update {
		return nil, errors.New("field [email] is required")
	}
	if i.Password == nil && !update {
		return nil, errors.New("field [password] is required")
	}
	if i.Email != nil {
		o.Email = *i.Email
	}
	if i.Password != nil {
		o.Password = *i.Password
	}
	if len(ids) > 0 {
		updID, err := uuid.FromString(ids[0])
		if err != nil {
			return nil, err
		}
		o.ID = updID
	}
	return o, err
}

// GothUserToDBUser transforms [user] goth to db model
func GothUserToDBUser(i *goth.User, update bool, ids ...string) (o *dbm.User, err error) {
	if i.Email == "" && !update {
		return nil, errors.New("field [Email] is required")
	}
	o = &dbm.User{
		Email:       i.Email,
		Name:        &i.Name,
		FirstName:   &i.FirstName,
		LastName:    &i.LastName,
		NickName:    &i.NickName,
		Location:    &i.Location,
		AvatarURL:   &i.AvatarURL,
		Description: &i.Description,
	}
	if len(ids) > 0 {
		updID, err := uuid.FromString(ids[0])
		if err != nil {
			return nil, err
		}
		o.ID = updID
	}
	return o, err
}

// GothUserToDBUserProfile transforms [user] goth to db model
func GothUserToDBUserProfile(i *goth.User, update bool, ids ...int) (o *dbm.UserProfile, err error) {
	if i.UserID == "" && !update {
		return nil, errors.New("field [UserID] is required")
	}
	if i.Email == "" && !update {
		return nil, errors.New("field [Email] is required")
	}
	o = &dbm.UserProfile{
		ExternalUserID: i.UserID,
		Provider:       i.Provider,
		Email:          i.Email,
		Name:           i.Name,
		FirstName:      i.FirstName,
		LastName:       i.LastName,
		NickName:       i.NickName,
		Location:       i.Location,
		AvatarURL:      i.AvatarURL,
		Description:    &i.Description,
	}
	if len(ids) > 0 {
		updID := ids[0]
		o.ID = updID
	}
	return o, err
}
```

to be continued ...
