---
layout: post
title: "The illusion of Encapsulation"
categories: [ general ]
tags: [ java, oop, api-design, architecture ]
excerpt: >
  Getters and setters were introduced as a practical way to represent data in Java. Decades later, the convention has 
  become so pervasive that it shapes how many developers interpret objects, often in ways the language itself never 
  specifies.
---
## The Beginner's Paradox

One of the first principles we learn when studying OOP is: *encapsulation is important.*
Nice one, I can agree with that.

I also learned:  *Java is an OOP language.* Okay!

Then comes the reality of your first job: let's write a DTO.

```java
public class User{
	private String name; 
	
	public String getName(){
		return this.name; 
	} 
	
	public void setName(String name){
		this.name = name; 
	}
}  
```

- **me:** but with the getter and setter, the field is public. why not just make it public?
- **senior:** No, Encapsulation is important! The field must remain private
- **me:** but...
- **senior:** That's the JavaBeans convention. That's  how it's done in Java.

My first reaction was incomprehension: Why does the `public` modifier even exist for fields if it so strongly shouldn't be used? And aren't objects supposed to enforce their own state's validity? How can they do it in this situation?

## Why and How: The Convention That Became Law

Objects are supposed to encapsulate state and behaviour; but the reality of DTOs is that they have a different purpose: representing data.

Conceptually, they are a collection of properties; they are closer to a C `struct` than to a rich domain object.

```c
struct user {
    char *name;
};
```

The problem is that, historically, Java had no way to express this concept. The language had primitives, enums and objects but nothing that explicitly meant *"this type is just data."*

So how do you represent a complex data structure in a language whose primary abstraction is **the object**? As an object, of course!

As the Java ecosystem grew,  frameworks and tools increasingly needed a standard way to discover and manipulate object properties. GUI builders, serializers, and later frameworks all faced the same challenge.

The JavaBeans specification answered that need by introducing a standardised property model based on getters and setters.

At the time, it was a pragmatic solution to a real problem. 

The convention worked remarkably well... for the problem it was designed to solve:  IDEs started generating getters and setters; frameworks understood them;  teams stopped documenting or testing them because they were considered trivial boilerplate.

Over time, the convention escaped its original purpose. Eventually, writing a stateful object without getters and setters started looking wrong. The convention had become the norm.

It no longer felt like a convention, it simply became how Java is written.

## The Social Contract

And because it became how Java is written, developers started building expectations.  Eventually, those expectations formed  a social contract, leading developers to infer things that the type system never promises.

Here are a few examples of situations I encountered with my  colleagues when I started  my Java journey, before I understood how deeply those conventions had shaped developers' expectations.  

In a new application, I prevented a list  from being modified via the getter so we had to use a designated  method for adding items. 
My reasoning was that a getter was meant to access the information, not to modify it, so it felt cleaner that way: 

```java
public List<Item> getItems() {
    return Collections.unmodifiableList(items);
}

public void addItem(Item item){
    this.items.add(item);
}
```

My colleague was outraged! Whether the design itself was better or not was almost beside the point. The issue was that I had broken his expectations. 

To him, `getItems()` meant gaining access to the `items` field. 

To me, it meant asking the object for its items. 

Those are not necessarily the same thing.

The social contract demands that a getter exposes a backing field. Diverging from that behaviour creates confusion.  

Looking back, we might have been able to compromise by skipping the getter naming convention like we did with another colleague where I proposed returning an `Optional`  from a getter-like method as the field was known to sometimes (often) be null:

```java
public class Person{
    private Address address; 
	... 
	Optional<Address> getAddress(){...}
}
```

The colleague rejected it, really uneasy, because "*the return type is not correct*". The expectation is that `getAddress` should return an `Address`.

In this case, he agreed for the need and we settled on an alternative name: 

```java
Optional<Address> findAddress(){...}
```

But compromising was only possible because he didn't feel that the method was a getter anymore. 

Trying to write an accessor that doesn't follow the get/set convention was also often poorly received.  
For example,  `person.name()` instead of `person.getName()` was a no go in my team because, "*That's not how it's done in java*".

Good conventions reduce cognitive load but they also shape our mental model: at some point, methods stopped being methods. 

When people see `person.getName();` they don't see a method to retrieve a person's name, they see the `name` property.

Which implies a set of expectations: 

For getters,  that they return a  backing field in O(1) time, that they won't perform any kind of transformation, validation nor side effects and often, that they are paired with a setter.

For setters, that they would perform simple assignment with no side effect, computation, normalisation nor any validation.  `Objects.requireNonNull(...)` is sometimes tolerated but more often than not, any kind of validation is perceived as a betrayal.

Ironically, most of those expectations were never part of Java or even the JavaBeans specification. They emerged organically over decades of shared practice.

And that wouldn't have been an issue if it had remained confined to data structure use cases only. 

But it didn't. 

> *When you have a hammer, everything is a nail.* 

 Habits are powerful. Once a solution becomes familiar, we naturally start applying it in places where it wasn't originally intended. 

## The hidden costs


Those expectations solved a real problem, but once they became pervasive, they also introduced some subtle costs.

### The illusion of encapsulation

First and foremost, what does **encapsulation** mean to you? While it is one of the fundamental principles of object-oriented programming, I'm not sure it means the same thing to everyone.

My understanding - and the one I'll be using in this section - is the following:

* allowing an object to keep control of its own state and enforce its invariants
*  hiding an object's internal representation behind its public interface 

While using methods to access an object's state technically preserves the encapsulation, in practice, following the expectations surrounding the JavaBeans conventions can undermine many of its benefits.  

#### Benefit #1: Maintaining invariants 

Because the field is private, we think the object is in control. Yet the very expectations encourage us to treat the getter and setter as direct field access.

See the following setter example. 

```java
    /**
     * Replace the current age with a new valid one
     *
     * @param age the new age of the person (does it even make sense to externally change the age? hmm... )
     * @throws NullPointerException if age is null
     * @throws BusinessException    if not 0 <= age <= MAXIMUM_AGE
     */
    public void setAge(Integer age) {
        Objects.requireNonNull(age);
        if (age < 0) {
            throw new BusinessException("Age must be strictly positive");
        }
        if (age > MAXIMUM_AGE) {
            throw new BusinessException("Nobody can be that old");
        }
        this.age = age;
    }
```

Have you seen many setters like this?  The reality of this method is that most  Java developers - including myself - would call it something like  `changeAge(...)` and not consider it a setter. 

As soon as we start using the control that encapsulation gives us, the method stops feeling like a setter.
It now has to be documented and tested because callers can no longer infer its behaviour from the naming convention alone.

But uncontrolled mutation jeopardises every other method on the object. 

Once the object can no longer assume that `age` is valid, every method operating on it becomes more defensive... or more fragile

```java 
    public boolean canDrinkAlcohol(){
        return this.age >= AGE_LIMIT; 
    }
```

#### Benefit #2: Information hiding

Here again, one of the benefits of encapsulation is that it allows an object to hide its internal structure.

In theory, this would let us rename - or remove - a field without impacting the public API. 

In practice, however, `getAge()` doesn't just expose a value. It also creates the expectation that a private field named `age` exists behind it.

Renaming that field now either changes the public API or creates a discrepancy between the implementation and what future developers expect to find.

Information hiding isn't only about what the language exposes. It's also about what developers infer.

So what information are we actually hiding? 

### Null creep

Once objects are no longer expected to enforce invariants, there is little preventing them from existing in partially populated states. 
At that point, reusing the same representation across several use cases becomes an attractive way to reduce duplication.

See the `Product` DTO here: 

```java  
@Data
public class Product{
    private Long id;
    private String name;
    private String description; 
    private List<Category> categories; 
}
```

* `id` is null when used as a request body in `createProduct` 
*  `description` and `categories` are null in the return  of `findProducts` as they are not needed in the listing. 
* All fields are populated in `getProduct`. 

Three use cases, three implicit contracts. 

The problem isn't the `null` values themselves, the problem is that nothing in the type tells us which fields are expected to be populated.  That knowledge now lives outside of the type system. 

Once again, explicit contracts are replaced by shared expectations.

### Boilerplate explosion

The last cost I would like to emphasise is the amount of ceremony involved. 

Beyond the number of  lines of code required to write those accessors, every field  exposed via methods becomes part of the public API.  And some qualities are expected from public API methods which are not necessarily expected nor beneficial for  getters and setters.  

Testing and documentation have costs attached to them. And when getters and setters are expected to be just dumb accessors, are those costs justified? 

In practice we either acknowledge them as a special kind of methods by exempting them from test/documentation or we decide to prioritise consistency and live with the costs. 

In any case, the sheer amount of boilerplate is a clue that something is off.

## Light at the end of the tunnel?

Unsurprisingly, the ecosystem started looking for ways to remove it.

###  IDE code generation 

The first step was IDE code generation. It reduced the effort required to write those methods, but they were still part of the codebase. The boilerplate remained, along with the maintenance burden.

Then came automated code generation from dedicated libraries. 

### Lombok's annotations

Lombok is an initiative aiming at reducing boilerplate (not only in getters and setters) by the use of annotations and code generation. 

The idea is that trivial code could be generated on the fly instead of painstakingly being written and maintained by hand. 

It's nice for boilerplate reduction, and it has the added value of increasing the code readability. 

The presence of annotations in the code base communicates intent much more clearly than by simply inferring it  from a combination of fields and accessor names: rather than merely generating boilerplate, annotations such as `@Getter`, `@Setter` or `@Data`  explicitly tell the  reader that the class is meant to be a data holder. 

But what it does not solve is the problem of differentiating data from behaviour in  the Java language; it only codified the convention (which is already a nice improvement in itself).  

### Records Clarify Intent

The introduction of records into the Java language is the first time the language explicitly recognises data carriers as a distinct construct. 

The fact that records use a noun as a name instead of an action is also a nice move in my opinion. It more clearly indicates that those methods are not acting on anything. They provide access to the underlying information.

Records are not an all-purpose solution but I believe it is a move in the right direction.  

## Conclusion

Over time, we've started conflating three different things.

- what **Java** allows,
- what **JavaBeans** standardised,
- what **Java developers** have come to expect.

Those three are related, but they're not the same.

As the convention became ubiquitous, it also shaped our mental model. More and more knowledge became implicit, relying on developers' expectations rather than on what the language or the type system explicitly expressed.

When someone says, *"That's not how Java is written,"* they're often not talking about the language at all. They're talking about the expectations inherited from a convention that solved a very real problem thirty years ago.

Getters and setters were meant to preserve the possibility of encapsulation. But the irony is that decades of convention have often discouraged us from exercising that possibility. In many codebases, getters and setters are no longer treated as methods that form an abstraction boundary; they're treated as public fields written with extra ceremony and stronger cultural expectations.

Fortunately, both the ecosystem and the language itself have continued to evolve. IDEs, Lombok and, more recently, records all acknowledge that data carriers deserve better support. Whether that evolution will eventually blur the line between data and behaviour less than JavaBeans did remains to be seen, but I think it's a step in the right direction.