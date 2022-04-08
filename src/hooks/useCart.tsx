import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productExists = cart.find(product => product.id === productId)
      const { data: productData } = await api.get(`/products/${productId}`)
      const { data: stockItem } = await api.get(`/stock/${productId}`)
      
      if(!productExists){
        setCart([...cart, {
          ...productData,
          amount: 1,
        }])

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
        return
      }

      if (productExists.amount > stockItem.amount) {
        toast.error('Quantidade solicitada fora de estoque') 
        return;
      }

      setCart(cart.map(product =>{
        if (product.id === productExists.id){
          return {
            ...product,
            amount: product.amount + 1,
          }
        }
        return product
      }))
      
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.find(product => product.id === productId)
      if (!productExists) {
        toast.error('Erro na remoção do produto');
        return;
      }

      setCart(cart.filter(product => product.id !== productId))
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data } = await api.get(`/stock/${productId}`)

      if (amount < 1){
        toast.error('Erro na alteração de quantidade do produto');
        return;
      }

      if (amount > data.amount) {
        toast.error('Quantidade solicitada fora de estoque') 
        return
      }


      setCart(cart.map(product=>{
        if (product.id === productId ){
          return {
            ...product,
            amount,
          }
        }
        return product;
      }))

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))

    } catch {
        toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
