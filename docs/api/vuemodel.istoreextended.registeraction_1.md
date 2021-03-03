<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@tybys/vuemodel](./vuemodel.md) &gt; [IStoreExtended](./vuemodel.istoreextended.md) &gt; [registerAction](./vuemodel.istoreextended.registeraction_1.md)

## IStoreExtended.registerAction() method

<b>Signature:</b>

```typescript
registerAction<P, R>(name: string, handler: (payload: P) => R | Promise<R>): IAction<P, R>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  name | string |  |
|  handler | (payload: P) =&gt; R \| Promise&lt;R&gt; |  |

<b>Returns:</b>

[IAction](./vuemodel.iaction.md)<!-- -->&lt;P, R&gt;
