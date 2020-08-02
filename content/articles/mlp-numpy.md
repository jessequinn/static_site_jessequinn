---
title: MLPs with Numpy
description: I present some recent work in my study of multilayered perceptrons (MLPs)
img: joao-tzanno-G9_Euqxpu4k-unsplash.jpg
alt: MLPs with Numpy
featured: 0
author: 
    name: Jesse Quinn
    bio: All about Jesse
    img: https://images.unsplash.com/photo-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80
    alt: profile photo
publishedAt: 2019-10-28T03:00:00.000Z
updateAt: 2020-07-19T03:00:00.000Z
---

I wanted to showcase some work I recently completed for a course in deep learning. I was recently challenged to make some MLPs with numpy and nothing else. Here is the [code](https://github.com/jessequinn/Coursera_DL/blob/master/week2/NumpyNN%20(honor).ipynb).

First we are given several classes to work with that form the foundation to my MLPs.

	class Layer:
		"""
		A building block. Each layer is capable of performing two things:
		- Process input to get output:           output = layer.forward(input)
			- Propagate gradients through itself:    grad_input = layer.backward(input, grad_output)
			Some layers also have learnable parameters which they update during layer.backward.
		"""
		def __init__(self):
			"""Here you can initialize layer parameters (if any) and auxiliary stuff."""
				# A dummy layer does nothing
				pass

		def forward(self, input):
			"""
			Takes input data of shape [batch, input_units], returns output data [batch, output_units]
			"""
			# A dummy layer just returns whatever it gets as input.
			return input

		def backward(self, input, grad_output):
			"""
			Performs a backpropagation step through the layer, with respect to the given input.
			To compute loss gradients w.r.t input, you need to apply chain rule (backprop):
			d loss / d x  = (d loss / d layer) * (d layer / d x)
			Luckily, you already receive d loss / d layer as input, so you only need to multiply it by d layer / d x.
			If your layer has parameters (e.g. dense layer), you also need to update them here using d loss / d layer
			"""
			# The gradient of a dummy layer is precisely grad_output, but we'll write it more explicitly
			num_units = input.shape[1]
			d_layer_d_input = np.eye(num_units)

			return np.dot(grad_output, d_layer_d_input) # chain rule
			

We also work with the ReLU activation function although sigmoid, etc. could easily be implemented :

	'''
	Activation function Rectified Linear Units (ReLU)
	f(x) = max(0, X)
	ReLU function is a simple function which is zero for any 
	input value below zero and the same value for values greater than zero.
	'''
	class ReLU(Layer):
		def __init__(self):
			"""ReLU layer simply applies elementwise rectified linear unit to all inputs"""
			pass
    
		def forward(self, input):
			"""Apply elementwise ReLU to [batch, input_units] matrix"""
			return np.maximum(0,input)
        
		def backward(self, input, grad_output):
			"""Compute gradient of loss w.r.t. ReLU input"""
			relu_grad = input > 0
			return grad_output*relu_grad        

and finally the dense layer that is based on our original layer:

	class Dense(Layer):
		def __init__(self, input_units, output_units, learning_rate=0.1):
			"""
			A dense layer is a layer which performs a learned affine transformation:
			f(x) = <W*x> + b
			"""
			self.learning_rate = learning_rate
			self.weights = np.random.randn(input_units, output_units)*0.01
			self.biases = np.zeros(output_units)
			self.grad_w = None

		def forward(self,input):
			"""
			Perform an affine transformation:
			f(x) = <W*x> + b

			input shape: [batch, input_units]
			output shape: [batch, output units]
			"""
			return np.dot(input,self.weights)+self.biases

		def backward(self,input,grad_output):
			grad_input = np.dot(grad_output,self.weights.T)       
			grad_weights = input.T@grad_output
			self.grad_w = grad_weights
			grad_biases = grad_output.sum(axis=0)       
			assert grad_weights.shape == self.weights.shape and grad_biases.shape == self.biases.shape
			self.weights = self.weights - self.learning_rate * grad_weights
			self.biases = self.biases - self.learning_rate * grad_biases

			return grad_input
			
Some loss functions:

	def softmax_crossentropy_with_logits(logits,reference_answers):
		"""Compute crossentropy from logits[batch,n_classes] and ids of correct answers"""
		logits_for_answers = logits[np.arange(len(logits)),reference_answers]

		xentropy = - logits_for_answers + np.log(np.sum(np.exp(logits),axis=-1))

		return xentropy

	def grad_softmax_crossentropy_with_logits(logits,reference_answers):
		"""Compute crossentropy gradient from logits[batch,n_classes] and ids of correct answers"""
		ones_for_answers = np.zeros_like(logits)
		ones_for_answers[np.arange(len(logits)),reference_answers] = 1

		softmax = np.exp(logits) / np.exp(logits).sum(axis=-1,keepdims=True)

		return (- ones_for_answers + softmax) / logits.shape[0]
	
We are working with the MNist data set of images from 0 to 9 so we need to load that data in (in my case I use a special :

	import matplotlib.pyplot as plt
	%matplotlib inline

	from preprocessed_mnist import load_dataset
	X_train, y_train, X_val, y_val, X_test, y_test = load_dataset(flatten=True)

	plt.figure(figsize=[6,6])
	for i in range(4):
		plt.subplot(2,2,i+1)
		plt.title("Label: %i"%y_train[i])
		plt.imshow(X_train[i].reshape([28,28]),cmap='gray');
		
based on the ```preprocessed_mnist.py``` that contains:

	import keras


	def load_dataset(flatten=False):
		(X_train, y_train), (X_test, y_test) = keras.datasets.mnist.load_data()

		# normalize x
		X_train = X_train.astype(float) / 255.
		X_test = X_test.astype(float) / 255.

		# we reserve the last 10000 training examples for validation
		X_train, X_val = X_train[:-10000], X_train[-10000:]
		y_train, y_val = y_train[:-10000], y_train[-10000:]

		if flatten:
			X_train = X_train.reshape([X_train.shape[0], -1])
			X_val = X_val.reshape([X_val.shape[0], -1])
			X_test = X_test.reshape([X_test.shape[0], -1])

		return X_train, y_train, X_val, y_val, X_test, y_test

We can now make a MLP:

	network = []
	network.append(Dense(X_train.shape[1],100))
	network.append(ReLU())
	network.append(Dense(100,200))
	network.append(ReLU())
	network.append(Dense(200,10))
	
But first we need to define some useful functions:

	def forward(network, X):
		"""
		Compute activations of all network layers by applying them sequentially.
		Return a list of activations for each layer. 
		Make sure last activation corresponds to network logits.
		"""
		activations = []
		input = X

		for layer in network:
			activations.append(layer.forward(input))
			input = activations[-1]

		assert len(activations) == len(network)
		return activations

	def predict(network,X):
		"""
		Compute network predictions.
		"""
		logits = forward(network,X)[-1]
		return logits.argmax(axis=-1)

	def train(network,X,y):
		"""
		Train your network on a given batch of X and y.
		You first need to run forward to get all layer activations.
		Then you can run layer.backward going from last to first layer.

		After you called backward for all layers, all Dense layers have already made one gradient step.
		"""

		# Get the layer activations
		layer_activations = forward(network,X)
		layer_inputs = [X]+layer_activations  #layer_input[i] is an input for network[i]
		logits = layer_activations[-1]

		# Compute the loss and the initial gradient
		loss = softmax_crossentropy_with_logits(logits,y)
		loss_grad = grad_softmax_crossentropy_with_logits(logits,y)

		for i in range(len(network))[::-1]:
			layer = network[i]
			loss_grad = layer.backward(layer_inputs[i],loss_grad)

		return np.mean(loss)
		
Our training loop:
	
	def iterate_minibatches(inputs, targets, batchsize, shuffle=False):
		assert len(inputs) == len(targets)
		if shuffle:
			indices = np.random.permutation(len(inputs))
		for start_idx in tqdm_utils.tqdm_notebook_failsafe(range(0, len(inputs) - batchsize + 1, batchsize)):
			if shuffle:
					excerpt = indices[start_idx:start_idx + batchsize]
			else:
					excerpt = slice(start_idx, start_idx + batchsize)
			yield inputs[excerpt], targets[excerpt]
			
Producing the graphs:

	from IPython.display import clear_output
	train_log = []
	val_log = []
	loss_log = []
			
	for epoch in range(25):
		for x_batch,y_batch in iterate_minibatches(X_train,y_train,batchsize=32,shuffle=True):
			loss_log.append(train(network,x_batch,y_batch))
    
		train_log.append(np.mean(predict(network,X_train)==y_train))
		val_log.append(np.mean(predict(network,X_val)==y_val))

		clear_output()
		print("Epoch",epoch)
		print("Train accuracy:",train_log[-1])
		print("Val accuracy:",val_log[-1])
		ax1 = plt.subplot(1,2,1)    
		plt.plot(train_log,label='train accuracy')
		plt.plot(val_log,label='val accuracy')
		ax2 = plt.subplot(1,2,2)
		plt.plot(loss_log,label='loss')
		ax1.legend(loc='best')
		ax2.legend(loc='best')
		plt.grid()
		plt.tight_layout()
		plt.show()
    
Now onto some other things. Implemented the Xavier initialization to a new class:
	
	class DenseWithXavierInitialization(Layer):
		def __init__(self, input_units, output_units, learning_rate=0.1):
			"""
			A dense layer is a layer which performs a learned affine transformation:
			f(x) = <W*x> + b
			"""
			self.learning_rate = learning_rate

			# Xavier initialization
			self.weights = np.random.randn(input_units, output_units)*np.sqrt(2/(input_units+output_units))
			self.biases = np.zeros(output_units)

		def forward(self,input):
			"""
			Perform an affine transformation:
			f(x) = <W*x> + b

			input shape: [batch, input_units]
			output shape: [batch, output units]
			"""
			return np.dot(input,self.weights)+self.biases

		def backward(self,input,grad_output):
			grad_input = np.dot(grad_output,self.weights.T)
			grad_weights = input.T@grad_output
			grad_biases = grad_output.sum(axis=0)
			assert grad_weights.shape == self.weights.shape and grad_biases.shape == self.biases.shape
			self.weights = self.weights - self.learning_rate * grad_weights
			self.biases = self.biases - self.learning_rate * grad_biases

			return grad_input
			
I also implemented L2 regularization:
	
	class DenseWithL2Regularization(Layer):
		def __init__(self, input_units, output_units, learning_rate=0.1, L2_alpha=0):
			"""
			A dense layer is a layer which performs a learned affine transformation:
			f(x) = <W*x> + b
			"""
			self.learning_rate = learning_rate

			# initialize weights with small random numbers
			self.weights = np.random.randn(input_units, output_units)*0.01
			self.biases = np.zeros(output_units)
			self.L2_alpha = L2_alpha
        
		def forward(self,input):
			"""
			Perform an affine transformation:
			f(x) = <W*x> + b

			input shape: [batch, input_units]
			output shape: [batch, output units]
			"""
			return np.dot(input,self.weights)+self.biases
    
		def backward(self,input,grad_output):
			grad_input = np.dot(grad_output,self.weights.T)
			grad_weights = input.T@grad_output + (2 * self.L2_alpha * self.weights)
			grad_biases = grad_output.sum(axis=0)
			assert grad_weights.shape == self.weights.shape and grad_biases.shape == self.biases.shape
			self.weights = self.weights - self.learning_rate * grad_weights
			self.biases = self.biases - self.learning_rate * grad_biases

			return grad_input
	
And finally I implemented RMSProp rather than SGD:
		
	class DenseWithRMSProp(Layer):
		def __init__(self, input_units, output_units, learning_rate=0.0001, RMS_alpha=0.85):
			"""
			A dense layer is a layer which performs a learned affine transformation:
			f(x) = <W*x> + b
			"""
			self.learning_rate = learning_rate

			# initialize weights with small random numbers
			self.weights = np.random.randn(input_units, output_units)*0.01
			self.biases = np.zeros(output_units)
			self.RMS_alpha = RMS_alpha
			self.gW = 0.0
			self.gB = 0.0
			self.eps = 1e-8

		def forward(self,input):
			"""
			Perform an affine transformation:
			f(x) = <W*x> + b

			input shape: [batch, input_units]
			output shape: [batch, output units]
			"""
			return np.dot(input,self.weights)+self.biases

		def backward(self,input,grad_output):
			grad_input = np.dot(grad_output,self.weights.T)
			grad_weights = input.T@grad_output
			grad_biases = grad_output.sum(axis=0)
			assert grad_weights.shape == self.weights.shape and grad_biases.shape == self.biases.shape
			self.gW = self.RMS_alpha*self.gW+(1-self.RMS_alpha)*(grad_weights**2)
			self.gB = self.RMS_alpha*self.gB+(1-self.RMS_alpha)*(grad_biases**2)
			self.weights = self.weights-self.learning_rate*(grad_weights/(np.sqrt(self.gW)+self.eps))
			self.biases = self.biases-self.learning_rate*(grad_biases/(np.sqrt(self.gB)+self.eps))

			return grad_input
	
All in all it was fun and quite challenging to cover some of these basic ideas in deep learning just using Numpy.
